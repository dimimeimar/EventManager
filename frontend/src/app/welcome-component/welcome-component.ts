import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { apiErrorMessage } from '../api-error';

// Σελίδα καλωσορίσματος: είσοδος, κουμπί εγγραφής και είσοδος ως επισκέπτης.
@Component({
  selector: 'app-welcome-component',
  standalone: false,
  templateUrl: './welcome-component.html',
})
export class WelcomeComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    // Αν ο χρήστης είναι ήδη συνδεδεμένος δεν χρειάζεται να δει ξανά τη φόρμα.
    if (this.authService.isLoggedIn()) {
      this.goToStartPage();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.goToStartPage(),
      error: (error: HttpErrorResponse) => {
        // 401: λάθος στοιχεία, 403: η αίτηση εκκρεμεί ή απορρίφθηκε
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  enterAsGuest(): void {
    this.errorMessage.set('');
    this.authService.guestLogin().subscribe({
      next: () => this.router.navigate(['/home']),
      error: (error: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(error)),
    });
  }

  // Ο διαχειριστής πάει στη διαχείριση χρηστών, οι υπόλοιποι στην αρχική σελίδα.
  private goToStartPage(): void {
    if (this.authService.hasRole('admin')) {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
