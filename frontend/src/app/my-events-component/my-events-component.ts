import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EventsApiService } from '../events-api.service';
import { EventDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Λίστα των εκδηλώσεων του διοργανωτή με τις ενέργειες δημοσίευση / ακύρωση / διαγραφή.
@Component({
  selector: 'app-my-events-component',
  standalone: false,
  templateUrl: './my-events-component.html',
})
export class MyEventsComponent implements OnInit {
  events = signal<EventDto[]>([]);
  errorMessage = signal('');

  constructor(private eventsApi: EventsApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.eventsApi.findMine().subscribe({
      next: (events) => this.events.set(events),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  publish(event: EventDto): void {
    this.run(this.eventsApi.publish(event.id));
  }

  cancel(event: EventDto): void {
    if (!confirm(`Να ακυρωθεί η εκδήλωση "${event.title}";`)) {
      return;
    }
    // Προαιρετικό μήνυμα προς όλους όσους έχουν κάνει κράτηση
    const message = prompt('Μήνυμα προς τους συμμετέχοντες που έχουν κάνει κράτηση (άφησέ το κενό για να μη σταλεί):') ?? '';
    this.run(this.eventsApi.cancel(event.id, message));
  }

  remove(event: EventDto): void {
    if (confirm(`Να διαγραφεί η εκδήλωση "${event.title}";`)) {
      this.run(this.eventsApi.remove(event.id));
    }
  }

  private run(request: { subscribe: (o: object) => unknown }): void {
    this.errorMessage.set('');
    request.subscribe({
      next: () => this.load(),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }
}
