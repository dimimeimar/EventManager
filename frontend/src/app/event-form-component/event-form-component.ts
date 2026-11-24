import { Component, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EventsApiService } from '../events-api.service';
import { CategoryDto, EventDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Φόρμα δημιουργίας και επεξεργασίας εκδήλωσης (reactive form).
// Οι τύποι εισιτηρίων είναι FormArray, ώστε να προστίθενται δυναμικά.
@Component({
  selector: 'app-event-form-component',
  standalone: false,
  templateUrl: './event-form-component.html',
})
export class EventFormComponent implements OnInit {
  categories = signal<CategoryDto[]>([]);
  errorMessage = signal('');
  editId: number | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private eventsApi: EventsApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      eventType: ['', Validators.required],
      venue: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [null as number | null],
      longitude: [null as number | null],
      startDateTime: ['', Validators.required],
      endDateTime: ['', Validators.required],
      capacity: [100, [Validators.required, Validators.min(1)]],
      description: [''],
      categoryIds: [[] as number[]],
      ticketTypes: this.fb.array([]),
    });
  }

  get ticketTypes(): FormArray {
    return this.form.get('ticketTypes') as FormArray;
  }

  ngOnInit(): void {
    this.eventsApi.categories().subscribe((c) => this.categories.set(c));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.eventsApi.findOne(this.editId).subscribe({
        next: (event) => this.fill(event),
        error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
      });
    } else {
      this.addTicketType();
    }
  }

  addTicketType(name = '', price: number | string = 0, quantity = 10): void {
    this.ticketTypes.push(
      this.fb.group({
        name: [name, Validators.required],
        price: [Number(price), [Validators.required, Validators.min(0)]],
        quantity: [quantity, [Validators.required, Validators.min(1)]],
      }),
    );
  }

  removeTicketType(index: number): void {
    this.ticketTypes.removeAt(index);
  }

  toggleCategory(id: number, checked: boolean): void {
    const current: number[] = this.form.value.categoryIds ?? [];
    this.form.patchValue({
      categoryIds: checked ? [...current, id] : current.filter((c: number) => c !== id),
    });
  }

  isSelected(id: number): boolean {
    const current: number[] = this.form.value.categoryIds ?? [];
    return current.includes(id);
  }

  // Τα datetime-local θέλουν τοπική ώρα χωρίς ζώνη: 2027-03-01T20:00
  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private fill(event: EventDto): void {
    this.form.patchValue({
      title: event.title,
      eventType: event.eventType,
      venue: event.venue,
      address: event.address,
      city: event.city,
      country: event.country,
      latitude: event.latitude,
      longitude: event.longitude,
      startDateTime: this.toLocalInput(event.startDateTime),
      endDateTime: this.toLocalInput(event.endDateTime),
      capacity: event.capacity,
      description: event.description,
      categoryIds: event.categories.map((c) => c.id),
    });
    this.ticketTypes.clear();
    event.ticketTypes.forEach((t) => this.addTicketType(t.name, t.price, t.quantity));
  }

  submit(): void {
    this.errorMessage.set('');
    if ((this.form.value.categoryIds ?? []).length === 0) {
      this.errorMessage.set('Διάλεξε τουλάχιστον μία κατηγορία.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      ...v,
      // το backend θέλει ISO ημερομηνίες· κενά γεωγραφικά πεδία δεν στέλνονται
      startDateTime: new Date(v.startDateTime as string).toISOString(),
      endDateTime: new Date(v.endDateTime as string).toISOString(),
      latitude: v.latitude ?? undefined,
      longitude: v.longitude ?? undefined,
    };
    const request = this.editId
      ? this.eventsApi.update(this.editId, body)
      : this.eventsApi.create(body);
    request.subscribe({
      next: (event) => this.router.navigate(['/events', event.id]),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }
}
