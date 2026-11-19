import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthUser } from '../events/events.service';

const people = {
  sender: { select: { id: true, username: true } },
  receiver: { select: { id: true, username: true } },
  event: { select: { id: true, title: true } },
};

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(dto: CreateMessageDto, user: AuthUser) {
    const receiver = await this.prisma.user.findUnique({
      where: { username: dto.receiverUsername },
    });
    if (!receiver || receiver.status !== 'APPROVED') {
      throw new NotFoundException('Ο παραλήπτης δεν βρέθηκε.');
    }
    if (receiver.id === user.userId) {
      throw new BadRequestException('Δεν μπορείς να στείλεις μήνυμα στον εαυτό σου.');
    }
    if (dto.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: dto.eventId } });
      if (!event) throw new NotFoundException('Η εκδήλωση δεν βρέθηκε.');
    }
    return this.prisma.message.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        senderId: user.userId,
        receiverId: receiver.id,
        eventId: dto.eventId,
      },
      include: people,
    });
  }

  // Εισερχόμενα: όσα δεν έχει διαγράψει ο παραλήπτης.
  inbox(user: AuthUser) {
    return this.prisma.message.findMany({
      where: { receiverId: user.userId, deletedByReceiver: false },
      include: people,
      orderBy: { sentAt: 'desc' },
    });
  }

  // Απεσταλμένα: όσα δεν έχει διαγράψει ο αποστολέας.
  sent(user: AuthUser) {
    return this.prisma.message.findMany({
      where: { senderId: user.userId, deletedBySender: false },
      include: people,
      orderBy: { sentAt: 'desc' },
    });
  }

  async unreadCount(user: AuthUser) {
    const count = await this.prisma.message.count({
      where: { receiverId: user.userId, isRead: false, deletedByReceiver: false },
    });
    return { count };
  }

  private async getOwn(id: number, user: AuthUser) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: people,
    });
    if (!message) throw new NotFoundException('Το μήνυμα δεν βρέθηκε.');
    const isSender = message.senderId === user.userId;
    const isReceiver = message.receiverId === user.userId;
    if (!isSender && !isReceiver) {
      throw new ForbiddenException('Το μήνυμα δεν σας ανήκει.');
    }
    return { message, isSender, isReceiver };
  }

  async findOne(id: number, user: AuthUser) {
    const { message, isReceiver } = await this.getOwn(id, user);
    // Όταν το ανοίγει ο παραλήπτης, σημειώνεται ως αναγνωσμένο.
    if (isReceiver && !message.isRead) {
      return this.prisma.message.update({
        where: { id },
        data: { isRead: true },
        include: people,
      });
    }
    return message;
  }

  // Η διαγραφή αφορά μόνο τη δική σου πλευρά: ο άλλος συνεχίζει να βλέπει το μήνυμα.
  async remove(id: number, user: AuthUser) {
    const { isSender, isReceiver } = await this.getOwn(id, user);
    await this.prisma.message.update({
      where: { id },
      data: {
        deletedBySender: isSender ? true : undefined,
        deletedByReceiver: isReceiver ? true : undefined,
      },
    });
    return { deleted: true };
  }
}
