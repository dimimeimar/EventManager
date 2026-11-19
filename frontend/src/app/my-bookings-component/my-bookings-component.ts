import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingsApiService } from '../bookings-api.service';
import { BookingDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Οι κρατήσεις του χρήστη, με δυνατότητα ακύρωσης.
@Component({
  selector: 'app-my-bookings-component',
  standalone: false,
  templateUrl: './my-bookings-component.html',
})
export class MyBookingsComponent implements OnInit {
  bookings = signal<BookingDto[]>([]);
  errorMessage = signal('');

  constructor(private bookingsApi: BookingsApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.bookingsApi.findMine().subscribe({
      next: (b) => this.bookings.set(b),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  cancel(booking: BookingDto): void {
    if (!confirm('Να ακυρωθεί η κράτηση;')) {
      return;
    }
    this.errorMessage.set('');
    this.bookingsApi.cancel(booking.id).subscribe({
      next: () => this.load(),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  statusText(status: string): string {
    return status === 'CANCELLED' ? 'Ακυρωμένη' : status === 'PENDING' ? 'Σε αναμονή' : 'Επιβεβαιωμένη';
  }
}
