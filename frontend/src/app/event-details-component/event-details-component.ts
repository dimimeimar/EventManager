import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { EventsApiService } from '../events-api.service';
import { EventDto } from '../model/event.dto';
import { AuthService } from '../auth/auth.service';
import { BookingsApiService } from '../bookings-api.service';
import { BookingDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Σελίδα μιας εκδήλωσης: στοιχεία, εισιτήρια, φωτογραφίες.
// Ο διοργανωτής μπορεί επιπλέον να ανεβάσει ή να διαγράψει φωτογραφίες.
@Component({
  selector: 'app-event-details-component',
  standalone: false,
  templateUrl: './event-details-component.html',
})
export class EventDetailsComponent implements OnInit {
  event = signal<EventDto | null>(null);
  errorMessage = signal('');
  readonly uploadsUrl = '/api/uploads';
  bookingMessage = signal('');
  bookingError = signal('');
  eventBookings = signal<BookingDto[]>([]);

  constructor(
    private route: ActivatedRoute,
    private eventsApi: EventsApiService,
    private authService: AuthService,
    private bookingsApi: BookingsApiService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.eventsApi.findOne(id).subscribe({
      next: (e) => {
        this.event.set(e);
        if (this.canManage(e)) {
          this.bookingsApi.findForEvent(e.id).subscribe((b) => this.eventBookings.set(b));
        }
      },
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  // Ο διοργανωτής (ή ο admin) διαχειρίζεται τις φωτογραφίες.
  canManage(event: EventDto): boolean {
    const state = this.authService.state;
    return state.userId === event.organizerId || state.roles.includes('admin');
  }

  // Μόνο ο χρήστης με ρόλο user κάνει κρατήσεις (όχι ο διοργανωτής της εκδήλωσης).
  canBook(event: EventDto): boolean {
    const state = this.authService.state;
    return (
      event.status === 'PUBLISHED' &&
      state.roles.includes('user') &&
      state.userId !== event.organizerId &&
      new Date(event.startDateTime) > new Date()
    );
  }

  book(event: EventDto, ticketTypeId: string, quantity: string): void {
    this.bookingMessage.set('');
    this.bookingError.set('');
    this.bookingsApi.create(Number(ticketTypeId), Number(quantity)).subscribe({
      next: (b) => {
        this.bookingMessage.set(`Η κράτηση ολοκληρώθηκε. Σύνολο: ${b.totalCost} €`);
        this.load();
      },
      error: (e: HttpErrorResponse) => this.bookingError.set(apiErrorMessage(e)),
    });
  }

  onFile(event: EventDto, input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.errorMessage.set('');
    this.eventsApi.uploadPhoto(event.id, file).subscribe({
      next: () => {
        input.value = '';
        this.load();
      },
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  removePhoto(event: EventDto, photoId: number): void {
    this.eventsApi.removePhoto(event.id, photoId).subscribe({
      next: () => this.load(),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }
}
