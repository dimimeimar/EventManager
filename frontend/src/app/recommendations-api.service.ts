import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface RecommendationDto {
  score: number;
  event: { id: number; title: string; city: string; country: string; startDateTime: string; eventType: string };
}

export interface MetricsDto {
  rmse: number;
  mae: number;
  precisionAtK: number;
  recallAtK: number;
  epochs: number;
}

export interface EvaluationDto {
  ratings: number;
  users: number;
  events: number;
  k: number;
  folds: number;
  options: { factors: number; learningRate: number; regularization: number; maxEpochs: number; patience: number };
  holdout: MetricsDto;
  crossValidation: { average: MetricsDto; perFold: MetricsDto[] };
}

// Κλήσεις προς το σύστημα συστάσεων.
@Injectable({ providedIn: 'root' })
export class RecommendationsApiService {
  constructor(private http: HttpClient) {}

  mine(): Observable<RecommendationDto[]> {
    return this.http.get<RecommendationDto[]>(`${API_BASE_URL}/recommendations`);
  }

  evaluation(folds: number, k: number): Observable<EvaluationDto> {
    return this.http.get<EvaluationDto>(`${API_BASE_URL}/recommendations/evaluation`, {
      params: { folds, k },
    });
  }
}
