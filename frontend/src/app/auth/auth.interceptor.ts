import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Προσθέτει το JWT σε κάθε αίτημα προς το API και χειρίζεται τα 401 / 403.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authReq = this.addToken(req);
    return next.handle(authReq).pipe(catchError((error) => this.handleError(req, error)));
  }

  private addToken(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.authService.accessToken();
    if (!token) {
      return req;
    }
    // Τα requests είναι immutable, οπότε φτιάχνουμε αντίγραφο με το header.
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private handleError(req: HttpRequest<unknown>, error: HttpErrorResponse) {
    // Τα σφάλματα του login / register τα δείχνει η ίδια η φόρμα.
    const isAuthRequest = req.url.includes('/auth/');

    if (!isAuthRequest && error.status === 401) {
      // Δεν υπάρχει έγκυρο token (π.χ. έληξε): αποσύνδεση και πίσω στην αρχική.
      this.authService.logout();
      this.router.navigate(['/']);
    }
    if (!isAuthRequest && error.status === 403) {
      this.router.navigate(['/forbidden']);
    }
    return throwError(() => error);
  }
}
