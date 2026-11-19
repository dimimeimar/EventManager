import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { BookingDto } from './model/event.dto';

// Κλήσεις προς τα endpoints των κρατήσεων.
@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  constructor(private http: HttpClient) {}

  create(ticketTypeId: number, numberOfTickets: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${API_BASE_URL}/bookings`, { ticketTypeId, numberOfTickets });
  }

  findMine(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${API_BASE_URL}/bookings/mine`);
  }

  cancel(id: number): Observable<BookingDto> {
    return this.http.patch<BookingDto>(`${API_BASE_URL}/bookings/${id}/cancel`, {});
  }

  findForEvent(eventId: number): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${API_BASE_URL}/events/${eventId}/bookings`);
  }
}
