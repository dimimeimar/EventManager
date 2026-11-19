import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Όνομα στοιχείου XML για κάθε στοιχείο μιας λίστας.
const ITEM_NAMES: Record<string, string> = {
  users: 'user',
  events: 'event',
  bookings: 'booking',
  messages: 'message',
  categories: 'category',
  ticketTypes: 'ticketType',
  photos: 'photo',
  roles: 'role',
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Μετατρέπει ένα απλό αντικείμενο/πίνακα/τιμή σε XML (με εσοχές).
function toXml(name: string, value: unknown, indent: string): string {
  if (value === null || value === undefined) {
    return `${indent}<${name}/>\n`;
  }
  if (Array.isArray(value)) {
    const item = ITEM_NAMES[name] ?? 'item';
    const inner = value.map((v) => toXml(item, v, indent + '  ')).join('');
    return `${indent}<${name}>\n${inner}${indent}</${name}>\n`;
  }
  if (typeof value === 'object') {
    const inner = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => toXml(k, v, indent + '  '))
      .join('');
    return `${indent}<${name}>\n${inner}${indent}</${name}>\n`;
  }
  return `${indent}<${name}>${escapeXml(String(value))}</${name}>\n`;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  // Όλα τα δεδομένα της εφαρμογής. Οι κωδικοί (passwordHash) δεν εξάγονται ποτέ.
  async collect() {
    const [users, events, bookings, messages] = await Promise.all([
      this.prisma.user.findMany({
        omit: { passwordHash: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.event.findMany({
        include: { categories: true, ticketTypes: true, photos: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.booking.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.message.findMany({ orderBy: { id: 'asc' } }),
    ]);
    // Το JSON round trip μετατρέπει Date και Decimal σε απλά strings.
    return JSON.parse(JSON.stringify({ users, events, bookings, messages }));
  }

  async asJson() {
    return JSON.stringify(await this.collect(), null, 2);
  }

  async asXml() {
    const data = await this.collect();
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      toXml('eventmanager', data, '')
    );
  }
}
