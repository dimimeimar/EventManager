import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Το DTD της εκφώνησης (σημείο 7). Μπαίνει μέσα στο XML ώστε το αρχείο να μπορεί να επικυρωθεί μόνο του.
const DTD = `<!ELEMENT Events (Event*)>
<!ELEMENT Event (Title, Category+, EventType, Venue, Address, City, Country, GeoLocation?, StartDateTime, EndDateTime, Capacity, TicketTypes, Bookings, Organizer, Status, Description, Media?)>
<!ATTLIST Event EventID CDATA #REQUIRED>
<!ELEMENT Title (#PCDATA)>
<!ELEMENT Category (#PCDATA)>
<!ELEMENT EventType (#PCDATA)>
<!ELEMENT Venue (#PCDATA)>
<!ELEMENT Address (#PCDATA)>
<!ELEMENT City (#PCDATA)>
<!ELEMENT Country (#PCDATA)>
<!ELEMENT GeoLocation EMPTY>
<!ATTLIST GeoLocation Latitude CDATA #REQUIRED Longitude CDATA #REQUIRED>
<!ELEMENT StartDateTime (#PCDATA)>
<!ELEMENT EndDateTime (#PCDATA)>
<!ELEMENT Capacity (#PCDATA)>
<!ELEMENT TicketTypes (TicketType+)>
<!ELEMENT TicketType (Name, Price, Quantity, Available)>
<!ATTLIST TicketType TicketTypeID CDATA #REQUIRED>
<!ELEMENT Name (#PCDATA)>
<!ELEMENT Price (#PCDATA)>
<!ELEMENT Quantity (#PCDATA)>
<!ELEMENT Available (#PCDATA)>
<!ELEMENT Bookings (Booking*)>
<!ELEMENT Booking (Attendee, Time, TicketTypeRef, NumberOfTickets, TotalCost, BookingStatus)>
<!ATTLIST Booking BookingID CDATA #REQUIRED>
<!ELEMENT Attendee EMPTY>
<!ATTLIST Attendee UserID CDATA #REQUIRED>
<!ELEMENT Time (#PCDATA)>
<!ELEMENT TicketTypeRef (#PCDATA)>
<!ELEMENT NumberOfTickets (#PCDATA)>
<!ELEMENT TotalCost (#PCDATA)>
<!ELEMENT BookingStatus (#PCDATA)>
<!ELEMENT Organizer EMPTY>
<!ATTLIST Organizer UserID CDATA #REQUIRED>
<!ELEMENT Status (#PCDATA)>
<!ELEMENT Description (#PCDATA)>
<!ELEMENT Media (Photo*)>
<!ELEMENT Photo (#PCDATA)>`;

// Η δομή του DTD σε αντικείμενα. Από αυτήν παράγονται και το JSON και το XML,
// ώστε να έχουν πάντα το ίδιο περιεχόμενο.
export interface ExportedEvent {
  EventID: string;
  Title: string;
  Category: string[];
  EventType: string;
  Venue: string;
  Address: string;
  City: string;
  Country: string;
  GeoLocation?: { Latitude: string; Longitude: string };
  StartDateTime: string;
  EndDateTime: string;
  Capacity: number;
  TicketTypes: {
    TicketTypeID: string;
    Name: string;
    Price: string;
    Quantity: number;
    Available: number;
  }[];
  Bookings: {
    BookingID: string;
    Attendee: { UserID: string };
    Time: string;
    TicketTypeRef: string;
    NumberOfTickets: number;
    TotalCost: string;
    BookingStatus: string;
  }[];
  Organizer: { UserID: string };
  Status: string;
  Description: string;
  Media?: { Photo: string[] };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Ημερομηνία στη μορφή του παραδείγματος της εκφώνησης: 2025-07-12T20:30:00
const iso = (d: Date) => d.toISOString().slice(0, 19);

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  // Όλες οι εκδηλώσεις με τις κρατήσεις τους, στη δομή του DTD.
  async collect(): Promise<ExportedEvent[]> {
    const events = await this.prisma.event.findMany({
      include: {
        categories: true,
        ticketTypes: { orderBy: { id: 'asc' } },
        photos: { orderBy: { id: 'asc' } },
        organizer: { select: { username: true } },
        bookings: {
          include: { user: { select: { username: true } } },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    return events.map((e) => {
      const out: ExportedEvent = {
        EventID: `EV${e.id}`,
        Title: e.title,
        Category: e.categories.map((c) => c.name),
        EventType: e.eventType,
        Venue: e.venue,
        Address: e.address,
        City: e.city,
        Country: e.country,
        StartDateTime: iso(e.startDateTime),
        EndDateTime: iso(e.endDateTime),
        Capacity: e.capacity,
        TicketTypes: e.ticketTypes.map((t) => ({
          TicketTypeID: `T${t.id}`,
          Name: t.name,
          Price: Number(t.price).toFixed(2),
          Quantity: t.quantity,
          Available: t.available,
        })),
        Bookings: e.bookings.map((b) => ({
          BookingID: `B${b.id}`,
          Attendee: { UserID: b.user.username },
          Time: iso(b.time),
          TicketTypeRef: `T${b.ticketTypeId}`,
          NumberOfTickets: b.numberOfTickets,
          TotalCost: Number(b.totalCost).toFixed(2),
          BookingStatus: b.status,
        })),
        Organizer: { UserID: e.organizer.username },
        Status: e.status,
        Description: e.description,
      };
      // το GeoLocation και το Media είναι προαιρετικά στο DTD
      if (e.latitude !== null && e.longitude !== null) {
        out.GeoLocation = { Latitude: String(e.latitude), Longitude: String(e.longitude) };
      }
      if (e.photos.length > 0) {
        out.Media = { Photo: e.photos.map((p) => p.filename) };
      }
      return out;
    });
  }

  async asJson(): Promise<string> {
    return JSON.stringify({ Events: await this.collect() }, null, 2);
  }

  async asXml(): Promise<string> {
    const events = await this.collect();
    const t = (name: string, value: string | number) => `<${name}>${escapeXml(String(value))}</${name}>`;
    const parts = events.map((e) => {
      const lines: string[] = [];
      lines.push(`  <Event EventID="${escapeXml(e.EventID)}">`);
      lines.push(`    ${t('Title', e.Title)}`);
      e.Category.forEach((c) => lines.push(`    ${t('Category', c)}`));
      lines.push(`    ${t('EventType', e.EventType)}`);
      lines.push(`    ${t('Venue', e.Venue)}`);
      lines.push(`    ${t('Address', e.Address)}`);
      lines.push(`    ${t('City', e.City)}`);
      lines.push(`    ${t('Country', e.Country)}`);
      if (e.GeoLocation) {
        lines.push(`    <GeoLocation Latitude="${e.GeoLocation.Latitude}" Longitude="${e.GeoLocation.Longitude}"/>`);
      }
      lines.push(`    ${t('StartDateTime', e.StartDateTime)}`);
      lines.push(`    ${t('EndDateTime', e.EndDateTime)}`);
      lines.push(`    ${t('Capacity', e.Capacity)}`);
      lines.push('    <TicketTypes>');
      for (const tt of e.TicketTypes) {
        lines.push(`      <TicketType TicketTypeID="${tt.TicketTypeID}">`);
        lines.push(`        ${t('Name', tt.Name)}`);
        lines.push(`        ${t('Price', tt.Price)}`);
        lines.push(`        ${t('Quantity', tt.Quantity)}`);
        lines.push(`        ${t('Available', tt.Available)}`);
        lines.push('      </TicketType>');
      }
      lines.push('    </TicketTypes>');
      lines.push('    <Bookings>');
      for (const b of e.Bookings) {
        lines.push(`      <Booking BookingID="${b.BookingID}">`);
        lines.push(`        <Attendee UserID="${escapeXml(b.Attendee.UserID)}"/>`);
        lines.push(`        ${t('Time', b.Time)}`);
        lines.push(`        ${t('TicketTypeRef', b.TicketTypeRef)}`);
        lines.push(`        ${t('NumberOfTickets', b.NumberOfTickets)}`);
        lines.push(`        ${t('TotalCost', b.TotalCost)}`);
        lines.push(`        ${t('BookingStatus', b.BookingStatus)}`);
        lines.push('      </Booking>');
      }
      lines.push('    </Bookings>');
      lines.push(`    <Organizer UserID="${escapeXml(e.Organizer.UserID)}"/>`);
      lines.push(`    ${t('Status', e.Status)}`);
      lines.push(`    ${t('Description', e.Description)}`);
      if (e.Media) {
        lines.push('    <Media>');
        e.Media.Photo.forEach((p) => lines.push(`      ${t('Photo', p)}`));
        lines.push('    </Media>');
      }
      lines.push('  </Event>');
      return lines.join('\n');
    });
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `<!DOCTYPE Events [\n${DTD}\n]>\n` +
      `<Events>\n${parts.join('\n')}${parts.length ? '\n' : ''}</Events>\n`
    );
  }
}
