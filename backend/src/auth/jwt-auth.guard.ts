import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Επιτρέπει το αίτημα μόνο αν έχει έγκυρο JWT.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
