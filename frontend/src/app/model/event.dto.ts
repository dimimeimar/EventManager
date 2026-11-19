export interface CategoryDto {
  id: number;
  name: string;
}

export interface TicketTypeDto {
  id?: number;
  name: string;
  price: number | string;
  quantity: number;
  available?: number;
}

export interface PhotoDto {
  id: number;
  filename: string;
}

export interface EventDto {
  id: number;
  title: string;
  eventType: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  description: string;
  organizerId: number;
  organizer: { id: number; username: string };
  categories: CategoryDto[];
  ticketTypes: TicketTypeDto[];
  photos: PhotoDto[];
}

// Μία σελίδα αποτελεσμάτων αναζήτησης.
export interface EventPageDto {
  items: EventDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingDto {
  id: number;
  time: string;
  numberOfTickets: number;
  totalCost: number | string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  event?: { id: number; title: string; startDateTime: string; city: string; status: string };
  ticketType?: { id?: number; name: string; price?: number | string };
  user?: { id: number; username: string; email: string };
}
