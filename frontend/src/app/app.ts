import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { AuthState } from './auth/auth-state';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  authState$: Observable<AuthState>;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.authState$ = this.authService.state$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
