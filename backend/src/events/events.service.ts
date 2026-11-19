import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, TicketTypeDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SearchEventsDto } from './dto/search-events.dto';
import { Prisma } from '../generated/prisma/client.mjs';

// Ο χρήστης όπως τον γεμίζει το JwtStrategy.
export interface AuthUser {
  userId: number;
  username: string;
  roles: string[];
}

const eventInclude = {
  categories: true,
  ticketTypes: true,
  photos: true,
  organizer: { select: { id: true, username: true } },
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // Έλεγχοι που ισχύουν για δημιουργία και αλλαγή.
  private validateRules(
    start: Date,
    end: Date,
    capacity: number,
    ticketTypes: TicketTypeDto[],
  ) {
    if (end <= start) {
      throw new BadRequestException(
        'Η λήξη πρέπει να είναι μετά την έναρξη.',
      );
    }
    const total = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
    if (total > capacity) {
      throw new BadRequestException(
        `Τα εισιτήρια (${total}) ξεπερνούν τη χωρητικότητα (${capacity}).`,
      );
    }
  }

  private async getOwned(id: number, user: AuthUser) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Η εκδήλωση δεν βρέθηκε.');
    if (event.organizerId !== user.userId && !user.roles.includes('admin')) {
      throw new ForbiddenException('Δεν είναι δική σας εκδήλωση.');
    }
    return event;
  }

  async create(dto: CreateEventDto, user: AuthUser) {
    const start = new Date(dto.startDateTime);
    const end = new Date(dto.endDateTime);
    this.validateRules(start, end, dto.capacity, dto.ticketTypes);

    return this.prisma.event.create({
      data: {
        title: dto.title,
        eventType: dto.eventType,
        venue: dto.venue,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startDateTime: start,
        endDateTime: end,
        capacity: dto.capacity,
        description: dto.description,
        organizerId: user.userId,
        categories: { connect: dto.categoryIds.map((id) => ({ id })) },
        ticketTypes: {
          create: dto.ticketTypes.map((t) => ({
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            available: t.quantity,
          })),
        },
      },
      include: eventInclude,
    });
  }

  findMine(user: AuthUser) {
    return this.prisma.event.findMany({
      where: { organizerId: user.userId },
      include: eventInclude,
      orderBy: { startDateTime: 'asc' },
    });
  }

  // Αναζήτηση δημοσιευμένων εκδηλώσεων με φίλτρα και σελιδοποίηση.
  async search(q: SearchEventsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 6;

    const where: Prisma.EventWhereInput = { status: 'PUBLISHED' };
    if (q.title) where.title = { contains: q.title, mode: 'insensitive' };
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' };
    if (q.categoryId) where.categories = { some: { id: q.categoryId } };
    if (q.from || q.to) {
      where.startDateTime = {
        gte: q.from ? new Date(q.from) : undefined,
        lte: q.to ? new Date(q.to) : undefined,
      };
    }
    // Φίλτρο τιμής: υπάρχει τύπος εισιτηρίου μέσα στο εύρος.
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.ticketTypes = {
        some: { price: { gte: q.minPrice, lte: q.maxPrice } },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: { startDateTime: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  findPublished() {
    return this.prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: eventInclude,
      orderBy: { startDateTime: 'asc' },
    });
  }

  async findOne(id: number, user: AuthUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) throw new NotFoundException('Η εκδήλωση δεν βρέθηκε.');
    const isOwner =
      event.organizerId === user.userId || user.roles.includes('admin');
    // Οι μη δημοσιευμένες φαίνονται μόνο στον διοργανωτή και στον admin.
    if (event.status === 'DRAFT' && !isOwner) {
      throw new NotFoundException('Η εκδήλωση δεν βρέθηκε.');
    }
    // Καταγραφή προβολής από συνδεδεμένο χρήστη (θα χρησιμεύσει στις συστάσεις).
    if (event.status === 'PUBLISHED' && !user.roles.includes('guest')) {
      await this.prisma.eventView.upsert({
        where: { userId_eventId: { userId: user.userId, eventId: id } },
        create: { userId: user.userId, eventId: id, views: 1 },
        update: { views: { increment: 1 } },
      });
    }
    return event;
  }

  async update(id: number, dto: UpdateEventDto, user: AuthUser) {
    const event = await this.getOwned(id, user);
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      throw new BadRequestException('Η εκδήλωση δεν μπορεί να αλλάξει.');
    }
    const bookings = await this.prisma.booking.count({
      where: { eventId: id, status: { not: 'CANCELLED' } },
    });
    const touchesStructure =
      dto.ticketTypes !== undefined ||
      dto.capacity !== undefined ||
      dto.startDateTime !== undefined ||
      dto.endDateTime !== undefined;
    if (bookings > 0 && touchesStructure) {
      throw new BadRequestException(
        'Υπάρχουν κρατήσεις: δεν αλλάζουν ημερομηνίες, χωρητικότητα ή εισιτήρια.',
      );
    }

    const start = dto.startDateTime
      ? new Date(dto.startDateTime)
      : event.startDateTime;
    const end = dto.endDateTime ? new Date(dto.endDateTime) : event.endDateTime;
    const capacity = dto.capacity ?? event.capacity;
    const tickets =
      dto.ticketTypes ??
      (
        await this.prisma.ticketType.findMany({ where: { eventId: id } })
      ).map((t) => ({
        name: t.name,
        price: Number(t.price),
        quantity: t.quantity,
      }));
    this.validateRules(start, end, capacity, tickets);

    return this.prisma.$transaction(async (tx) => {
      if (dto.ticketTypes) {
        await tx.ticketType.deleteMany({ where: { eventId: id } });
      }
      return tx.event.update({
        where: { id },
        data: {
          title: dto.title,
          eventType: dto.eventType,
          venue: dto.venue,
          address: dto.address,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          startDateTime: dto.startDateTime ? start : undefined,
          endDateTime: dto.endDateTime ? end : undefined,
          capacity: dto.capacity,
          description: dto.description,
          categories: dto.categoryIds
            ? { set: dto.categoryIds.map((cid) => ({ id: cid })) }
            : undefined,
          ticketTypes: dto.ticketTypes
            ? {
                create: dto.ticketTypes.map((t) => ({
                  name: t.name,
                  price: t.price,
                  quantity: t.quantity,
                  available: t.quantity,
                })),
              }
            : undefined,
        },
        include: eventInclude,
      });
    });
  }

  async publish(id: number, user: AuthUser) {
    const event = await this.getOwned(id, user);
    if (event.status !== 'DRAFT') {
      throw new BadRequestException('Μόνο πρόχειρη εκδήλωση δημοσιεύεται.');
    }
    return this.prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: eventInclude,
    });
  }

  async cancel(id: number, user: AuthUser) {
    const event = await this.getOwned(id, user);
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Μόνο δημοσιευμένη εκδήλωση ακυρώνεται.');
    }
    // Ακυρώνονται και οι κρατήσεις της.
    return this.prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { eventId: id },
        data: { status: 'CANCELLED' },
      });
      return tx.event.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: eventInclude,
      });
    });
  }

  async remove(id: number, user: AuthUser) {
    await this.getOwned(id, user);
    const bookings = await this.prisma.booking.count({
      where: { eventId: id },
    });
    if (bookings > 0) {
      throw new BadRequestException(
        'Έχει κρατήσεις: μπορεί μόνο να ακυρωθεί, όχι να διαγραφεί.',
      );
    }
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true };
  }

  async addPhoto(id: number, filename: string, user: AuthUser) {
    await this.getOwned(id, user);
    return this.prisma.photo.create({ data: { filename, eventId: id } });
  }

  async removePhoto(id: number, photoId: number, user: AuthUser) {
    await this.getOwned(id, user);
    const photo = await this.prisma.photo.findFirst({
      where: { id: photoId, eventId: id },
    });
    if (!photo) throw new NotFoundException('Η φωτογραφία δεν βρέθηκε.');
    await this.prisma.photo.delete({ where: { id: photoId } });
    return { deleted: true };
  }

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
