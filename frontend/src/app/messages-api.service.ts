import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { MessageDto } from './model/event.dto';

// Κλήσεις προς τα endpoints των μηνυμάτων.
@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private readonly baseUrl = `${API_BASE_URL}/messages`;

  constructor(private http: HttpClient) {}

  inbox(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/inbox`);
  }

  sent(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/sent`);
  }

  open(id: number): Observable<MessageDto> {
    return this.http.get<MessageDto>(`${this.baseUrl}/${id}`);
  }

  send(body: { receiverUsername: string; subject: string; body: string; eventId?: number }): Observable<MessageDto> {
    return this.http.post<MessageDto>(this.baseUrl, body);
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
