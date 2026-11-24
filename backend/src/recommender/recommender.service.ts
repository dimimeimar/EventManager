import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BiasedMF, DEFAULT_OPTIONS, Triple } from './bmf';
import { crossValidate, evaluate, trainValidationSplit } from './evaluation';

const MODEL_TTL_MS = 10 * 60 * 1000; // το μοντέλο ξαναεκπαιδεύεται το πολύ κάθε 10 λεπτά

@Injectable()
export class RecommenderService {
  private model?: BiasedMF;
  private trainedAt = 0;
  private seen = new Map<number, Set<number>>(); // userId -> events με γνωστή αξιολόγηση

  constructor(private readonly prisma: PrismaService) {}

  // Συγκεντρώνει τις τριάδες (userId, eventId, rating) από τρεις πηγές:
  //  1. ρητές αξιολογήσεις (πίνακας Rating, από το dataset)
  //  2. κρατήσεις: μια κράτηση που δεν ακυρώθηκε μετράει ως 5
  //  3. προβολές σελίδας εκδήλωσης: μετράνε ως 3 (ήπιο ενδιαφέρον)
  // Αν υπάρχουν περισσότερες από μία πηγές για το ίδιο ζεύγος, κερδίζει η πρώτη.
  async buildTriples(): Promise<Triple[]> {
    const map = new Map<string, Triple>();
    const add = (userId: number, eventId: number, rating: number) => {
      const key = `${userId}:${eventId}`;
      if (!map.has(key)) map.set(key, { userId, eventId, rating });
    };
    for (const r of await this.prisma.rating.findMany()) add(r.userId, r.eventId, r.value);
    for (const b of await this.prisma.booking.findMany({ where: { status: { not: 'CANCELLED' } } })) {
      add(b.userId, b.eventId, 5);
    }
    for (const v of await this.prisma.eventView.findMany()) add(v.userId, v.eventId, 3);
    return [...map.values()];
  }

  private async getModel(force = false): Promise<BiasedMF> {
    if (!force && this.model && Date.now() - this.trainedAt < MODEL_TTL_MS) return this.model;
    const triples = await this.buildTriples();
    const model = new BiasedMF(DEFAULT_OPTIONS);
    model.train(triples);
    this.seen.clear();
    for (const t of triples) {
      if (!this.seen.has(t.userId)) this.seen.set(t.userId, new Set());
      this.seen.get(t.userId)!.add(t.eventId);
    }
    this.model = model;
    this.trainedAt = Date.now();
    return model;
  }

  // Οι top N εκδηλώσεις που ο χρήστης δεν έχει δει/αξιολογήσει.
  async recommend(userId: number, n = 5) {
    const model = await this.getModel();
    const seen = this.seen.get(userId) ?? new Set<number>();
    const events = await this.prisma.event.findMany({
      where: { status: 'PUBLISHED', organizerId: { not: userId } },
      select: { id: true, title: true, city: true, country: true, startDateTime: true, eventType: true },
    });
    const candidates = events.filter((e) => !seen.has(e.id));
    const top = model.recommend(userId, candidates.map((e) => e.id), n);
    const byId = new Map(candidates.map((e) => [e.id, e]));
    return top.map((t) => ({
      // εμφανίζεται η βαθμολογία 1..5, η κατάταξη έγινε με την ακατέργαστη τιμή
      score: Math.round(Math.min(5, Math.max(1, t.score)) * 100) / 100,
      event: byId.get(t.eventId)!,
    }));
  }

  // Αξιολόγηση του αλγορίθμου: ένα hold-out 80/20 και l-fold cross validation.
  async evaluate(folds = 5, k = 5) {
    const triples = await this.buildTriples();
    const { train, validation } = trainValidationSplit(triples, 0.2);
    const model = new BiasedMF(DEFAULT_OPTIONS);
    model.train(train, validation);
    const holdout = { ...evaluate(model, validation, k), epochs: model.epochsRun };
    const cv = crossValidate(triples, folds, k);
    return {
      ratings: triples.length,
      users: new Set(triples.map((t) => t.userId)).size,
      events: new Set(triples.map((t) => t.eventId)).size,
      options: DEFAULT_OPTIONS,
      k,
      folds,
      holdout,
      crossValidation: cv,
    };
  }

  async retrain() {
    await this.getModel(true);
    return { trainedAt: new Date(this.trainedAt).toISOString() };
  }
}
