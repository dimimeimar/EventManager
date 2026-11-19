import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthUser } from '../events/events.service';

const bookingInclude = {
  event: { select: { id: true, title: true, startDateTime: true, city: true, status: true } },
  ticketType: { select: { id: true, name: true, price: true } },
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto, user: AuthUser) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
      include: { event: true },
    });
    if (!ticketType) throw new NotFoundException('Ο τύπος εισιτηρίου δεν βρέθηκε.');
    const event = ticketType.event;
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Η εκδήλωση δεν δέχεται κρατήσεις.');
    }
    if (event.startDateTime <= new Date()) {
      throw new BadRequestException('Η εκδήλωση έχει ήδη ξεκινήσει.');
    }
    if (event.organizerId === user.userId) {
      throw new BadRequestException('Δεν μπορείς να κάνεις κράτηση στη δική σου εκδήλωση.');
    }

    // Όλα μέσα σε transaction: αν δεν υπάρχουν αρκετά εισιτήρια δεν γίνεται τίποτα.
    // Το updateMany με συνθήκη available >= n είναι ατομικό, άρα δύο ταυτόχρονες
    // κρατήσεις δεν μπορούν να πουλήσουν τα ίδια εισιτήρια.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticketType.updateMany({
        where: { id: ticketType.id, available: { gte: dto.numberOfTickets } },
        data: { available: { decrement: dto.numberOfTickets } },
      });
      if (updated.count === 0) {
        throw new ConflictException('Δεν υπάρχουν αρκετά διαθέσιμα εισιτήρια.');
      }
      return tx.booking.create({
        data: {
          eventId: event.id,
          userId: user.userId,
          ticketTypeId: ticketType.id,
          numberOfTickets: dto.numberOfTickets,
          totalCost: Number(ticketType.price) * dto.numberOfTickets,
          status: 'CONFIRMED',
        },
        include: bookingInclude,
      });
    });
  }

  findMine(user: AuthUser) {
    return this.prisma.booking.findMany({
      where: { userId: user.userId },
      include: bookingInclude,
      orderBy: { time: 'desc' },
    });
  }

  // Κρατήσεις μιας εκδήλωσης: μόνο για τον διοργανωτή (ή τον admin).
  async findForEvent(eventId: number, user: AuthUser) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Η εκδήλωση δεν βρέθηκε.');
    if (event.organizerId !== user.userId && !user.roles.includes('admin')) {
      throw new ForbiddenException('Δεν είναι δική σας εκδήλωση.');
    }
    return this.prisma.booking.findMany({
      where: { eventId },
      include: {
        ticketType: { select: { name: true } },
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: { time: 'desc' },
    });
  }

  async cancel(id: number, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!booking) throw new NotFoundException('Η κράτηση δεν βρέθηκε.');
    if (booking.userId !== user.userId) {
      throw new ForbiddenException('Δεν είναι δική σας κράτηση.');
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Η κράτηση είναι ήδη ακυρωμένη.');
    }
    if (booking.event.startDateTime <= new Date()) {
      throw new BadRequestException('Η εκδήλωση έχει ξεκινήσει, δεν γίνεται ακύρωση.');
    }
    // Τα εισιτήρια ξαναγίνονται διαθέσιμα.
    return this.prisma.$transaction(async (tx) => {
      await tx.ticketType.update({
        where: { id: booking.ticketTypeId },
        data: { available: { increment: booking.numberOfTickets } },
      });
      return tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: bookingInclude,
      });
    });
  }
}
