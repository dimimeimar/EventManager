import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Τα στοιχεία που στέλνει η φόρμα εγγραφής.
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[A-Za-z0-9_.]+$/, {
    message:
      'Το όνομα χρήστη επιτρέπεται να έχει μόνο λατινικά γράμματα, αριθμούς, τελεία και κάτω παύλα',
  })
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  confirmPassword: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+?[0-9 ]{10,15}$/, { message: 'Μη έγκυρο τηλέφωνο' })
  phone: string;

  @IsString()
  @MinLength(1)
  address: string;

  @IsString()
  @MinLength(1)
  city: string;

  @IsString()
  @MinLength(1)
  country: string;

  // Γεωγραφική τοποθεσία (προαιρετική)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @Matches(/^[0-9]{9}$/, { message: 'Το ΑΦΜ πρέπει να έχει 9 ψηφία' })
  afm: string;
}
