import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CategoryDto, EventDto, EventPageDto, PhotoDto } from './model/event.dto';

// Κλήσεις προς τα endpoints των εκδηλώσεων. Το JWT το βάζει ο AuthInterceptor.
@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly baseUrl = `${API_BASE_URL}/events`;

  constructor(private http: HttpClient) {}

  categories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${API_BASE_URL}/categories`);
  }

  // Αναζήτηση με φίλτρα: στέλνονται μόνο τα πεδία που έχουν τιμή.
  search(filters: Record<string, string | number | null | undefined>): Observable<EventPageDto> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<EventPageDto>(`${this.baseUrl}/search`, { params });
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
