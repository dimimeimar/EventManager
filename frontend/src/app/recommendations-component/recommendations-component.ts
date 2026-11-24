import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RecommendationDto, RecommendationsApiService } from '../recommendations-api.service';
import { apiErrorMessage } from '../api-error';

// Οι 5 εκδηλώσεις που προτείνει ο αλγόριθμος στον χρήστη.
@Component({
  selector: 'app-recommendations-component',
  standalone: false,
  templateUrl: './recommendations-component.html',
})
export class RecommendationsComponent implements OnInit {
  items = signal<RecommendationDto[] | null>(null);
  errorMessage = signal('');

  constructor(private api: RecommendationsApiService) {}

  ngOnInit(): void {
    this.api.mine().subscribe({
      next: (r) => this.items.set(r),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }
}
