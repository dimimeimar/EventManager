// Αρχικά δεδομένα της βάσης. Εκτέλεση: npm run prisma:seed
// Δημιουργεί τον ενσωματωμένο διαχειριστή και μερικές κατηγορίες εκδηλώσεων.
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.mjs';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  'Music',
  'Live Performance',
  'Theatre',
  'Cinema',
  'Sports',
  'Conference',
  'Seminar',
  'Workshop',
  'Festival',
  'Exhibition',
];

async function main() {
  // --- Διαχειριστής ---
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminData = {
    email: 'admin@example.com',
    passwordHash: adminPasswordHash,
    firstName: 'Admin',
    lastName: 'Admin',
    phone: '2100000000',
    address: 'Πανεπιστημιούπολη',
    city: 'Αθήνα',
    country: 'Greece',
    afm: '000000000',
    roles: ['admin'],
    status: 'APPROVED' as const,
    active: true,
  };
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: adminData,
    create: { username: 'admin', ...adminData },
  });

  // --- Κατηγορίες ---
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Η βάση αρχικοποιήθηκε (admin / admin123).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
