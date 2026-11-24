import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { EvaluationDto, RecommendationsApiService } from '../recommendations-api.service';
import { apiErrorMessage } from '../api-error';

// Μετρικές του recommender: hold-out 80/20 και l-fold cross validation.
@Component({
  selector: 'app-admin-evaluation-component',
  standalone: false,
  templateUrl: './admin-evaluation-component.html',
})
export class AdminEvaluationComponent {
  result = signal<EvaluationDto | null>(null);
  errorMessage = signal('');
  loading = signal(false);

  constructor(private api: RecommendationsApiService) {}

  run(folds: string, k: string): void {
    this.errorMessage.set('');
    this.loading.set(true);
    this.api.evaluation(Number(folds) || 5, Number(k) || 5).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.errorMessage.set(apiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
