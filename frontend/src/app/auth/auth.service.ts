import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { AuthState } from './auth-state';
import { JwtClaims } from './jwt-claims';
import { LoginDto } from './login.dto';
import { LoginResponseDto } from './login-response.dto';
import { RegisterDto } from './register.dto';
import { PublicUserDto } from '../model/public-user.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly authUrl = `${API_BASE_URL}/auth`;

  // Κρατά την τρέχουσα κατάσταση σύνδεσης και ενημερώνει όσους την παρακολουθούν.
  private readonly stateSubject = new BehaviorSubject<AuthState>(this.readState());
  readonly state$ = this.stateSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(dto: LoginDto): Observable<void> {
    return this.http.post<LoginResponseDto>(`${this.authUrl}/login`, dto).pipe(
      tap((response) => this.saveToken(response.access_token)),
      map(() => void 0),
    );
  }

  // Είσοδος ως επισκέπτης: το backend δίνει token με ρόλο guest.
  guestLogin(): Observable<void> {
    return this.http.post<LoginResponseDto>(`${this.authUrl}/guest`, {}).pipe(
      tap((response) => this.saveToken(response.access_token)),
      map(() => void 0),
    );
  }

  // Η εγγραφή δεν δίνει token. Ο χρήστης περιμένει έγκριση από τον διαχειριστή.
  register(dto: RegisterDto): Observable<PublicUserDto> {
    return this.http.post<PublicUserDto>(`${this.authUrl}/register`, dto);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.stateSubject.next(this.readState());
  }

  accessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.stateSubject.value.authenticated;
  }

  hasRole(role: string): boolean {
    return this.stateSubject.value.roles.includes(role);
  }

  username(): string | null {
    return this.stateSubject.value.username;
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.stateSubject.next(this.readState());
  }

  // Διαβάζει το token από το localStorage και φτιάχνει το AuthState.
  // Η επαλήθευση της υπογραφής γίνεται μόνο στο backend, εδώ απλά
  // διαβάζουμε το payload για να ξέρουμε τι θα δείξουμε στη διεπαφή.
  private readState(): AuthState {
    const loggedOut: AuthState = { authenticated: false, username: null, roles: [] };

    const token = this.accessToken();
    if (!token) {
      return loggedOut;
    }

    try {
      // Το payload είναι το μεσαίο κομμάτι του token, σε base64url.
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(payload)) as JwtClaims;

      const expired = claims.exp * 1000 <= Date.now();
      if (expired) {
        localStorage.removeItem(this.tokenKey);
        return loggedOut;
      }

      return {
        authenticated: true,
        username: claims.username,
        roles: claims.roles,
      };
    } catch {
      localStorage.removeItem(this.tokenKey);
      return loggedOut;
    }
  }
}
