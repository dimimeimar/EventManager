// Εισαγωγή του dataset (rel_event_csvs) στη βάση.
// Εκτέλεση:  npm run seed:dataset            (ή με --reset για διαγραφή και νέα εισαγωγή)
//
// Τα CSV πρέπει να βρίσκονται στον φάκελο backend/data/rel_event_csvs
// (ή στον φάκελο που δίνεται στη μεταβλητή DATASET_DIR).
//
// Τι γίνεται:
//  1. Φτιάχνουμε αξιολογήσεις 1..5:
//       event_interest:  interested = 5,  not_interested = 1
//       event_attendees: yes = 5, maybe = 3, no = 1   (μόνο γραμμές με user_id)
//  2. Κρατάμε μόνο χρήστες και εκδηλώσεις που υπάρχουν στα users.csv / events.csv.
//  3. Δημιουργούμε χρήστες ds_<id> (κωδικός dataset123), εκδηλώσεις "Εκδήλωση #<id>"
//     με εισιτήριο και κατηγορία, και τον πίνακα Rating.
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.mjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL! }),
});

const DIR = process.env.DATASET_DIR ?? path.join(process.cwd(), 'data', 'rel_event_csvs');
const USER_PREFIX = 'ds_';
const TITLE_PREFIX = 'Εκδήλωση #';

// Διαβάζει ένα CSV γραμμή-γραμμή (τα αρχεία είναι πολύ μεγάλα) και καλεί το onRow.
async function readCsv(file: string, onRow: (row: string[], header: string[]) => void) {
  const parser = fs
    .createReadStream(path.join(DIR, file))
    .pipe(parse({ relax_quotes: true, relax_column_count: true, skip_empty_lines: true }));
  let header: string[] | null = null;
  for await (const row of parser as AsyncIterable<string[]>) {
    if (!header) {
      header = row;
      continue;
    }
    onRow(row, header);
  }
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function reset() {
  console.log('Διαγραφή προηγούμενης εισαγωγής...');
  await prisma.event.deleteMany({ where: { title: { startsWith: TITLE_PREFIX } } });
  await prisma.user.deleteMany({ where: { username: { startsWith: USER_PREFIX } } });
}

async function main() {
  if (!fs.existsSync(path.join(DIR, 'event_interest.csv'))) {
    throw new Error(`Δεν βρέθηκαν τα CSV στον φάκελο ${DIR}`);
  }
  if (process.argv.includes('--reset')) await reset();
  if ((await prisma.event.count({ where: { title: { startsWith: TITLE_PREFIX } } })) > 0) {
    console.log('Το dataset έχει ήδη εισαχθεί. Τρέξε με --reset για νέα εισαγωγή.');
    return;
  }

  // 1. Αξιολογήσεις
  const ratings = new Map<string, number>(); // "user:event" -> 1..5
  await readCsv('event_interest.csv', (r, h) => {
    const user = r[h.indexOf('user')];
    const event = r[h.indexOf('event')];
    if (r[h.indexOf('interested')] === '1') ratings.set(`${user}:${event}`, 5);
    else if (r[h.indexOf('not_interested')] === '1') ratings.set(`${user}:${event}`, 1);
  });
  const fromInterest = ratings.size;
  const statusValue: Record<string, number> = { yes: 5, maybe: 3, no: 1 };
  await readCsv('event_attendees.csv', (r, h) => {
    const user = r[h.indexOf('user_id')];
    const value = statusValue[r[h.indexOf('status')]];
    if (!user || value === undefined) return;
    const key = `${user}:${r[h.indexOf('event')]}`;
    if (!ratings.has(key)) ratings.set(key, value); // η ρητή δήλωση ενδιαφέροντος υπερισχύει
  });
  console.log(`Αξιολογήσεις: ${ratings.size} (${fromInterest} από event_interest)`);

  const wantedUsers = new Set<string>();
  const wantedEvents = new Set<string>();
  for (const key of ratings.keys()) {
    const [u, e] = key.split(':');
    wantedUsers.add(u);
    wantedEvents.add(e);
  }

  // 2. Χρήστες και εκδηλώσεις που χρειάζονται
  const users = new Map<string, { city: string }>();
  await readCsv('users.csv', (r, h) => {
    const id = r[h.indexOf('user_id')];
    if (wantedUsers.has(id)) users.set(id, { city: r[h.indexOf('location')] || 'Άγνωστη' });
  });

  type DsEvent = { start: Date; city: string; country: string; lat: number | null; lng: number | null; word: number };
  const events = new Map<string, DsEvent>();
  console.log('Διάβασμα events.csv (μεγάλο αρχείο, θέλει λίγο χρόνο)...');
  await readCsv('events.csv', (r, h) => {
    const id = r[h.indexOf('event_id')];
    if (!wantedEvents.has(id)) return;
    const start = new Date(r[h.indexOf('start_time')].replace(' ', 'T') + 'Z');
    if (isNaN(start.getTime())) return;
    // "κυρίαρχη λέξη" = η στήλη c_1..c_100 με τη μεγαλύτερη τιμή
    const first = h.indexOf('c_1');
    let word = 0;
    let max = -1;
    for (let c = 0; c < 100; c++) {
      const v = Number(r[first + c]);
      if (v > max) { max = v; word = c; }
    }
    const lat = parseFloat(r[h.indexOf('lat')]);
    const lng = parseFloat(r[h.indexOf('lng')]);
    events.set(id, {
      start,
      city: r[h.indexOf('city')] || 'Άγνωστη',
      country: r[h.indexOf('country')] || 'Άγνωστη',
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng,
      word,
    });
  });

  // Κρατάμε μόνο αξιολογήσεις με γνωστό χρήστη ΚΑΙ γνωστή εκδήλωση.
  const valid = [...ratings].filter(([k]) => {
    const [u, e] = k.split(':');
    return users.has(u) && events.has(e);
  });
  const usedUsers = new Set(valid.map(([k]) => k.split(':')[0]));
  const usedEvents = new Set(valid.map(([k]) => k.split(':')[1]));
  console.log(`Έγκυρες αξιολογήσεις: ${valid.length}, χρήστες: ${usedUsers.size}, εκδηλώσεις: ${usedEvents.size}`);

  // 3. Εισαγωγή στη βάση
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) throw new Error('Δεν υπάρχει ο admin. Τρέξε πρώτα: npm run prisma:seed');
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  if (categories.length === 0) throw new Error('Δεν υπάρχουν κατηγορίες. Τρέξε πρώτα: npm run prisma:seed');

  const passwordHash = await bcrypt.hash('dataset123', 10); // ίδιο hash για όλους, για ταχύτητα
  for (const part of chunks([...usedUsers], 2000)) {
    await prisma.user.createMany({
      data: part.map((id) => ({
        username: USER_PREFIX + id,
        email: `${USER_PREFIX}${id}@dataset.local`,
        passwordHash,
        firstName: 'Χρήστης',
        lastName: id,
        phone: '0000000000',
        address: '-',
        city: users.get(id)!.city,
        country: '-',
        afm: '000000000',
        roles: ['user'],
        status: 'APPROVED' as const,
      })),
      skipDuplicates: true,
    });
  }

  for (const part of chunks([...usedEvents], 2000)) {
    await prisma.event.createMany({
      data: part.map((id) => {
        const e = events.get(id)!;
        const category = categories[e.word % categories.length];
        return {
          title: TITLE_PREFIX + id,
          eventType: category.name,
          venue: 'Άγνωστος χώρος',
          address: e.city,
          city: e.city,
          country: e.country,
          latitude: e.lat,
          longitude: e.lng,
          startDateTime: e.start,
          endDateTime: new Date(e.start.getTime() + 2 * 3600 * 1000),
          capacity: 1000,
          status: 'PUBLISHED' as const,
          description: 'Εκδήλωση από το dataset της εργασίας.',
          organizerId: admin.id,
        };
      }),
    });
  }

  // Αντιστοίχιση ids dataset -> ids βάσης
  const userMap = new Map<string, number>();
  for (const u of await prisma.user.findMany({ where: { username: { startsWith: USER_PREFIX } }, select: { id: true, username: true } })) {
    userMap.set(u.username.slice(USER_PREFIX.length), u.id);
  }
  const eventMap = new Map<string, number>();
  for (const e of await prisma.event.findMany({ where: { title: { startsWith: TITLE_PREFIX } }, select: { id: true, title: true } })) {
    eventMap.set(e.title.slice(TITLE_PREFIX.length), e.id);
  }

  await prisma.ticketType.createMany({
    data: [...eventMap.values()].map((eventId) => ({
      eventId, name: 'Γενική είσοδος', price: 0, quantity: 1000, available: 1000,
    })),
  });

  // Κατηγορία ανά εκδήλωση (πίνακας συσχέτισης Category <-> Event: A = Category, B = Event)
  const pairs: string[] = [];
  for (const [dsId, eventId] of eventMap) {
    pairs.push(`(${categories[events.get(dsId)!.word % categories.length].id},${eventId})`);
  }
  for (const part of chunks(pairs, 5000)) {
    await prisma.$executeRawUnsafe(`INSERT INTO "_CategoryToEvent" ("A","B") VALUES ${part.join(',')} ON CONFLICT DO NOTHING`);
  }

  const ratingRows = valid.map(([k, value]) => {
    const [u, e] = k.split(':');
    return { userId: userMap.get(u)!, eventId: eventMap.get(e)!, value };
  });
  for (const part of chunks(ratingRows, 10000)) {
    await prisma.rating.createMany({ data: part, skipDuplicates: true });
  }
  console.log(`Τέλος: ${userMap.size} χρήστες, ${eventMap.size} εκδηλώσεις, ${ratingRows.length} αξιολογήσεις.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
