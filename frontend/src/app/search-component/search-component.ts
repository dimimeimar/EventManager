import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventsApiService } from '../events-api.service';
import { CategoryDto, EventPageDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Αναζήτηση δημοσιευμένων εκδηλώσεων με φίλτρα και σελιδοποίηση.
@Component({
  selector: 'app-search-component',
  standalone: false,
  templateUrl: './search-component.html',
})
export class SearchComponent implements OnInit {
  categories = signal<CategoryDto[]>([]);
  result = signal<EventPageDto | null>(null);
  errorMessage = signal('');
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private eventsApi: EventsApiService,
  ) {
    this.form = this.fb.group({
      text: [''],
      location: [''],
      categoryId: [''],
      from: [''],
      to: [''],
      minPrice: [''],
      maxPrice: [''],
    });
  }

  ngOnInit(): void {
    this.eventsApi.categories().subscribe((c) => this.categories.set(c));
    this.load(1);
  }

  load(page: number): void {
    this.errorMessage.set('');
    const v = this.form.value;
    this.eventsApi
      .search({
        ...v,
        // οι ημερομηνίες (input date) γίνονται ISO για το backend
        from: v.from ? new Date(v.from + 'T00:00:00').toISOString() : '',
        to: v.to ? new Date(v.to + 'T23:59:59').toISOString() : '',
        page,
        pageSize: 6,
      })
      .subscribe({
        next: (r) => this.result.set(r),
        error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
      });
  }

  reset(): void {
    this.form.reset({ text: '', location: '', categoryId: '', from: '', to: '', minPrice: '', maxPrice: '' });
    this.load(1);
  }

  // Η χαμηλότερη τιμή εισιτηρίου της εκδήλωσης.
  minPriceOf(tickets: { price: number | string }[]): number {
    return Math.min(...tickets.map((t) => Number(t.price)));
  }
}
