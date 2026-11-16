import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

// Επιτρέπει την πλοήγηση μόνο σε συνδεδεμένους χρήστες (και επισκέπτες με token).
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    return this.authService.isLoggedIn() ? true : this.router.createUrlTree(['/']);
  }
}
