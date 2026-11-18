import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { EventsApiService } from '../events-api.service';
import { EventDto } from '../model/event.dto';
import { AuthService } from '../auth/auth.service';
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

  constructor(
    private route: ActivatedRoute,
    private eventsApi: EventsApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.eventsApi.findOne(id).subscribe({
      next: (e) => this.event.set(e),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  // Ο διοργανωτής (ή ο admin) διαχειρίζεται τις φωτογραφίες.
  canManage(event: EventDto): boolean {
    const state = this.authService.state;
    return state.userId === event.organizerId || state.roles.includes('admin');
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
