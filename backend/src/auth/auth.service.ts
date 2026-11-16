import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt.payload';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findInternalByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Λάθος όνομα χρήστη ή κωδικός');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Λάθος όνομα χρήστη ή κωδικός');
    }

    // Ο κωδικός είναι σωστός, αλλά μπαίνουν μόνο οι εγκεκριμένοι χρήστες.
    if (user.status === 'PENDING') {
      throw new ForbiddenException(
        'Η αίτηση εγγραφής σου εκκρεμεί για έγκριση από τον διαχειριστή',
      );
    }
    if (user.status === 'REJECTED') {
      throw new ForbiddenException('Η αίτηση εγγραφής σου απορρίφθηκε');
    }
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // Εγγραφή νέου χρήστη. Δεν επιστρέφει token, γιατί πρώτα πρέπει
  // να εγκριθεί η αίτηση από τον διαχειριστή.
  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Οι δύο κωδικοί δεν ταιριάζουν');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      latitude: dto.latitude,
      longitude: dto.longitude,
      afm: dto.afm,
    });
  }

  // Είσοδος επισκέπτη: token με ρόλο guest, χωρίς λογαριασμό στη βάση.
  // Έτσι και ο επισκέπτης καλεί το API με JWT, αλλά μόνο για ανάγνωση.
  async guestLogin() {
    const payload: JwtPayload = {
      sub: 0,
      username: 'guest',
      roles: ['guest'],
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
