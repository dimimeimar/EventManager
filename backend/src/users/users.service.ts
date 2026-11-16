import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User as DbUser, UserStatus } from '../generated/prisma/client.mjs';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserDto } from './dto/public-user.dto';

// Τα στοιχεία που χρειάζονται για να δημιουργηθεί ένας νέος χρήστης.
// Ο κωδικός έρχεται ήδη ως hash από το AuthService.
export interface NewUserData {
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  afm: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Δημιουργία χρήστη από τη ροή εγγραφής. Ο χρήστης μένει PENDING
  // μέχρι να τον εγκρίνει ο διαχειριστής.
  async create(data: NewUserData): Promise<PublicUserDto> {
    const sameUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (sameUsername) {
      throw new ConflictException(
        'Το όνομα χρήστη χρησιμοποιείται ήδη. Διάλεξε ένα άλλο.',
      );
    }

    const sameEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (sameEmail) {
      throw new ConflictException('Το email χρησιμοποιείται ήδη.');
    }

    const user = await this.prisma.user.create({
      data: {
        ...data,
        roles: ['user'],
        status: UserStatus.PENDING,
      },
    });
    return this.toPublicUser(user);
  }

  // Λίστα χρηστών για τον διαχειριστή, προαιρετικά μόνο μιας κατάστασης.
  async findAll(status?: string): Promise<PublicUserDto[]> {
    let statusFilter: UserStatus | undefined = undefined;
    if (status) {
      if (!(status in UserStatus)) {
        throw new BadRequestException('Άγνωστη κατάσταση χρήστη');
      }
      statusFilter = status as UserStatus;
    }

    const users = await this.prisma.user.findMany({
      where: { active: true, status: statusFilter },
      orderBy: { id: 'asc' },
    });
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: number): Promise<PublicUserDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, active: true },
    });
    if (!user) {
      throw new NotFoundException('Ο χρήστης δεν βρέθηκε');
    }
    return this.toPublicUser(user);
  }

  // Χρησιμοποιείται μόνο από το AuthModule, γιατί επιστρέφει και το passwordHash.
  async findInternalByUsername(username: string): Promise<DbUser | null> {
    return this.prisma.user.findFirst({
      where: { username, active: true },
    });
  }

  approve(id: number): Promise<PublicUserDto> {
    return this.changeStatus(id, UserStatus.APPROVED);
  }

  reject(id: number): Promise<PublicUserDto> {
    return this.changeStatus(id, UserStatus.REJECTED);
  }

  // Έγκριση ή απόρριψη επιτρέπεται μόνο για αιτήσεις που εκκρεμούν.
  private async changeStatus(
    id: number,
    newStatus: UserStatus,
  ): Promise<PublicUserDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, active: true },
    });
    if (!user) {
      throw new NotFoundException('Ο χρήστης δεν βρέθηκε');
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException('Η αίτηση του χρήστη έχει ήδη εξεταστεί');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });
    return this.toPublicUser(updated);
  }

  private toPublicUser(user: DbUser): PublicUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      city: user.city,
      country: user.country,
      latitude: user.latitude,
      longitude: user.longitude,
      afm: user.afm,
      roles: user.roles,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
