import { BiasedMF, BmfOptions, DEFAULT_OPTIONS, Triple } from './bmf';

export interface Metrics {
  rmse: number;
  mae: number;
  precisionAtK: number;
  recallAtK: number;
  epochs: number;
}

// Μια αξιολόγηση θεωρείται "σχετική" (ο χρήστης θα την ήθελε) αν είναι >= 4.
export const RELEVANT = 4;

function makeShuffler(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Precision@K και Recall@K (μόνο για χρήστες με >= 2 αξιολογήσεις στο validation): για κάθε χρήστη του validation set βάζουμε σε σειρά
// τις εκδηλώσεις του validation (που δεν έχει δει στο training) και κοιτάμε
// πόσες από τις K πρώτες είναι σχετικές.
export function precisionRecallAtK(model: BiasedMF, validation: Triple[], k: number) {
  const byUser = new Map<number, Triple[]>();
  for (const t of validation) {
    if (!byUser.has(t.userId)) byUser.set(t.userId, []);
    byUser.get(t.userId)!.push(t);
  }
  let precisionSum = 0;
  let recallSum = 0;
  let users = 0;
  for (const [userId, rows] of byUser) {
    // με ένα μόνο στοιχείο δεν υπάρχει κατάταξη να κριθεί, άρα ο χρήστης αγνοείται
    if (rows.length < 2) continue;
    const relevant = rows.filter((r) => r.rating >= RELEVANT).length;
    if (relevant === 0) continue; // χωρίς σχετικά στοιχεία δεν ορίζεται recall
    const top = rows
      .map((r) => ({ r, score: model.predict(userId, r.eventId, false) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    const hits = top.filter((x) => x.r.rating >= RELEVANT).length;
    // αν ο χρήστης έχει στο validation λιγότερες από K εκδηλώσεις, διαιρούμε με το πλήθος τους
    precisionSum += hits / Math.min(k, rows.length);
    recallSum += hits / relevant;
    users++;
  }
  return {
    precisionAtK: users ? precisionSum / users : 0,
    recallAtK: users ? recallSum / users : 0,
  };
}

export function evaluate(model: BiasedMF, validation: Triple[], k: number): Omit<Metrics, 'epochs'> {
  return {
    rmse: model.rmse(validation),
    mae: model.mae(validation),
    ...precisionRecallAtK(model, validation, k),
  };
}

// Απλός διαχωρισμός: ποσοστό των αξιολογήσεων πάει σε validation.
export function trainValidationSplit(data: Triple[], validationShare = 0.2, seed = 1) {
  const random = makeShuffler(seed);
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cut = Math.floor(shuffled.length * (1 - validationShare));
  return { train: shuffled.slice(0, cut), validation: shuffled.slice(cut) };
}

// l-fold cross validation: τα δεδομένα χωρίζονται σε l κομμάτια, κάθε κομμάτι
// γίνεται με τη σειρά validation και ο μέσος όρος των μετρικών είναι το αποτέλεσμα.
export function crossValidate(
  data: Triple[],
  folds: number,
  k: number,
  options: BmfOptions = DEFAULT_OPTIONS,
): { average: Metrics; perFold: Metrics[] } {
  const random = makeShuffler(options.seed);
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const perFold: Metrics[] = [];
  for (let f = 0; f < folds; f++) {
    const validation = shuffled.filter((_, idx) => idx % folds === f);
    const train = shuffled.filter((_, idx) => idx % folds !== f);
    const model = new BiasedMF(options);
    model.train(train, validation);
    perFold.push({ ...evaluate(model, validation, k), epochs: model.epochsRun });
  }
  const avg = (key: keyof Metrics) => perFold.reduce((s, m) => s + m[key], 0) / perFold.length;
  return {
    perFold,
    average: {
      rmse: avg('rmse'),
      mae: avg('mae'),
      precisionAtK: avg('precisionAtK'),
      recallAtK: avg('recallAtK'),
      epochs: avg('epochs'),
    },
  };
}
