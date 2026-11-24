import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter } from 'rxjs';
import { MessagesApiService } from './messages-api.service';
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
  unread$: Observable<number>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messagesApi: MessagesApiService,
  ) {
    this.authState$ = this.authService.state$;
    this.unread$ = this.messagesApi.unread$;
    // Σε κάθε αλλαγή σελίδας ελέγχουμε αν υπάρχουν νέα μηνύματα.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const state = this.authService.state;
      if (state.authenticated && !state.roles.includes('guest')) {
        this.messagesApi.refreshUnread();
      } else {
        this.messagesApi.unread$.next(0);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
