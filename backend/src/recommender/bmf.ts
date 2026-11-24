// Biased Matrix Factorization (εκπαίδευση με SGD).
//
// Πρόβλεψη:  x̂ij = µ + bi + cj + viᵀ·fj
//   µ  = μέσος όρος όλων των γνωστών αξιολογήσεων
//   bi = bias του χρήστη i      cj = bias της εκδήλωσης j
//   vi = παράγοντες (factors) του χρήστη    fj = παράγοντες της εκδήλωσης
//
// Ο αλγόριθμος δουλεύει με τριάδες (userId, eventId, rating) και δεν ξέρει
// τίποτα για τη βάση δεδομένων, ώστε να τεστάρεται μόνος του.

export interface Triple {
  userId: number;
  eventId: number;
  rating: number;
}

export interface BmfOptions {
  factors: number; // k: πλήθος λανθανόντων παραγόντων
  learningRate: number; // η
  regularization: number; // λ
  maxEpochs: number;
  patience: number; // πόσες διαδοχικές εποχές χωρίς βελτίωση του RMSE επιτρέπονται
  seed: number; // για επαναλήψιμα αποτελέσματα
}

export const DEFAULT_OPTIONS: BmfOptions = {
  factors: 10,
  learningRate: 0.02,
  regularization: 0.02,
  maxEpochs: 100,
  patience: 2,
  seed: 42,
};

// Μικρός γεννήτορας ψευδοτυχαίων αριθμών (mulberry32), ώστε ίδιο seed = ίδιο αποτέλεσμα.
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class BiasedMF {
  private mu = 0;
  private userBias = new Map<number, number>();
  private itemBias = new Map<number, number>();
  private userFactors = new Map<number, number[]>();
  private itemFactors = new Map<number, number[]>();
  epochsRun = 0;

  constructor(private readonly options: BmfOptions = DEFAULT_OPTIONS) {}

  hasUser(userId: number): boolean {
    return this.userBias.has(userId);
  }

  hasItem(eventId: number): boolean {
    return this.itemBias.has(eventId);
  }

  // Εκπαίδευση μόνο στα γνωστά ζεύγη. Αν δοθεί validation, το κριτήριο
  // τερματισμού μετράει το RMSE πάνω σε αυτό (αλλιώς στο training set).
  train(train: Triple[], validation: Triple[] = []): void {
    const { factors: k, learningRate: eta, regularization: lambda } = this.options;
    const random = makeRandom(this.options.seed);

    this.mu = train.reduce((s, t) => s + t.rating, 0) / Math.max(train.length, 1);
    this.userBias.clear();
    this.itemBias.clear();
    this.userFactors.clear();
    this.itemFactors.clear();

    // Αρχικοποίηση: bias = 0, μικρές τυχαίες τιμές για τους παράγοντες.
    for (const t of train) {
      if (!this.userBias.has(t.userId)) {
        this.userBias.set(t.userId, 0);
        this.userFactors.set(t.userId, Array.from({ length: k }, () => (random() - 0.5) * 0.1));
      }
      if (!this.itemBias.has(t.eventId)) {
        this.itemBias.set(t.eventId, 0);
        this.itemFactors.set(t.eventId, Array.from({ length: k }, () => (random() - 0.5) * 0.1));
      }
    }

    const data = [...train];
    const monitor = validation.length > 0 ? validation : train;
    let best = Infinity;
    let bad = 0;
    this.epochsRun = 0;

    for (let epoch = 0; epoch < this.options.maxEpochs; epoch++) {
      this.shuffle(data, random);
      for (const { userId: i, eventId: j, rating: x } of data) {
        const vi = this.userFactors.get(i)!;
        const fj = this.itemFactors.get(j)!;
        const bi = this.userBias.get(i)!;
        const cj = this.itemBias.get(j)!;

        let dot = 0;
        for (let f = 0; f < k; f++) dot += vi[f] * fj[f];
        const e = x - (this.mu + bi + cj + dot);

        this.userBias.set(i, bi + eta * (e - lambda * bi));
        this.itemBias.set(j, cj + eta * (e - lambda * cj));
        for (let f = 0; f < k; f++) {
          const old = vi[f]; // το παλιό vi χρησιμοποιείται στην ενημέρωση του fj
          vi[f] += eta * (e * fj[f] - lambda * vi[f]);
          fj[f] += eta * (e * old - lambda * fj[f]);
        }
      }

      this.epochsRun = epoch + 1;
      const rmse = this.rmse(monitor);
      if (rmse < best - 1e-6) {
        best = rmse;
        bad = 0;
      } else if (++bad >= this.options.patience) {
        break; // δύο συνεχόμενες εποχές χωρίς βελτίωση
      }
    }
  }

  // Πρόβλεψη. Άγνωστος χρήστης/εκδήλωση: οι όροι που λείπουν θεωρούνται 0.
  // clamp=false επιστρέφει την ακατέργαστη τιμή: χρησιμεύει στην κατάταξη, γιατί
  // μετά το κόψιμο στο 5 πολλές εκδηλώσεις θα είχαν την ίδια βαθμολογία.
  predict(userId: number, eventId: number, clamp = true): number {
    const bi = this.userBias.get(userId) ?? 0;
    const cj = this.itemBias.get(eventId) ?? 0;
    const vi = this.userFactors.get(userId);
    const fj = this.itemFactors.get(eventId);
    let dot = 0;
    if (vi && fj) for (let f = 0; f < vi.length; f++) dot += vi[f] * fj[f];
    const raw = this.mu + bi + cj + dot;
    // οι βαθμολογίες είναι από 1 έως 5
    return clamp ? Math.min(5, Math.max(1, raw)) : raw;
  }

  rmse(data: Triple[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((s, t) => s + (t.rating - this.predict(t.userId, t.eventId)) ** 2, 0);
    return Math.sqrt(sum / data.length);
  }

  mae(data: Triple[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((s, t) => s + Math.abs(t.rating - this.predict(t.userId, t.eventId)), 0);
    return sum / data.length;
  }

  // Οι top N εκδηλώσεις (από τις candidates) με την υψηλότερη προβλεπόμενη βαθμολογία.
  recommend(userId: number, candidates: number[], n = 5): { eventId: number; score: number }[] {
    return candidates
      .map((eventId) => ({ eventId, score: this.predict(userId, eventId, false) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  private shuffle<T>(arr: T[], random: () => number): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
