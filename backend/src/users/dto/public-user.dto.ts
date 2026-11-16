// Τα στοιχεία χρήστη που επιστρέφει το API.
// Δεν περιέχει ποτέ το passwordHash.
export class PublicUserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  afm: string;
  roles: string[];
  status: string;
  createdAt: Date;
}
