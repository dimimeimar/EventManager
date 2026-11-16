import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { PublicUserDto } from './model/public-user.dto';

// Κλήσεις προς τα /users endpoints (μόνο για τον διαχειριστή).
// Το JWT το προσθέτει ο AuthInterceptor.
@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly baseUrl = `${API_BASE_URL}/users`;

  constructor(private http: HttpClient) {}

  // status: '' για όλους, αλλιώς PENDING / APPROVED / REJECTED
  findAll(status: string): Observable<PublicUserDto[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PublicUserDto[]>(this.baseUrl, { params });
  }

  findOne(id: number): Observable<PublicUserDto> {
    return this.http.get<PublicUserDto>(`${this.baseUrl}/${id}`);
  }

  approve(id: number): Observable<PublicUserDto> {
    return this.http.patch<PublicUserDto>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: number): Observable<PublicUserDto> {
    return this.http.patch<PublicUserDto>(`${this.baseUrl}/${id}/reject`, {});
  }
}
