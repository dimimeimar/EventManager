import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CategoryDto, EventDto, PhotoDto } from './model/event.dto';

// Κλήσεις προς τα endpoints των εκδηλώσεων. Το JWT το βάζει ο AuthInterceptor.
@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly baseUrl = `${API_BASE_URL}/events`;

  constructor(private http: HttpClient) {}

  categories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${API_BASE_URL}/categories`);
  }

  findPublished(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(this.baseUrl);
  }

  findMine(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/mine`);
  }

  findOne(id: number): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.baseUrl}/${id}`);
  }

  create(body: unknown): Observable<EventDto> {
    return this.http.post<EventDto>(this.baseUrl, body);
  }

  update(id: number, body: unknown): Observable<EventDto> {
    return this.http.patch<EventDto>(`${this.baseUrl}/${id}`, body);
  }

  publish(id: number): Observable<EventDto> {
    return this.http.patch<EventDto>(`${this.baseUrl}/${id}/publish`, {});
  }

  cancel(id: number): Observable<EventDto> {
    return this.http.patch<EventDto>(`${this.baseUrl}/${id}/cancel`, {});
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  uploadPhoto(id: number, file: File): Observable<PhotoDto> {
    const data = new FormData();
    data.append('photo', file);
    return this.http.post<PhotoDto>(`${this.baseUrl}/${id}/photos`, data);
  }

  removePhoto(id: number, photoId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}/photos/${photoId}`);
  }
}
