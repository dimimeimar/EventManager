// Ο χρήστης όπως τον επιστρέφει το backend (χωρίς κωδικό).
export interface PublicUserDto {
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
