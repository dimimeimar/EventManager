import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/register.dto';
import { apiErrorMessage } from '../api-error';

// Validator για όλη τη φόρμα: οι δύο κωδικοί πρέπει να είναι ίδιοι.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-component',
  standalone: false,
  templateUrl: './register-component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = signal('');
  // true όταν το backend απάντησε ότι το username υπάρχει ήδη (409)
  usernameTaken = signal(false);
  submitted = signal(false);

  // Οι κανόνες είναι ίδιοι με του RegisterDto στο backend.
  form = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-z0-9_.]+$/),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{10,15}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['Greece', Validators.required],
      latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
      afm: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    },
    { validators: passwordsMatch },
  );

  // Δείχνουμε σφάλμα σε ένα πεδίο μόνο αφού ο χρήστης το αγγίξει ή πατήσει υποβολή.
  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  showPasswordMismatch(): boolean {
    const confirm = this.form.get('confirmPassword');
    return (
      this.form.hasError('passwordsMismatch') && !!confirm && (confirm.touched || this.submitted())
    );
  }

  // Συμπληρώνει τις συντεταγμένες από την τοποθεσία του browser.
  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.errorMessage.set('Ο browser δεν υποστηρίζει εντοπισμό τοποθεσίας.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => this.errorMessage.set('Δεν ήταν δυνατός ο εντοπισμός της τοποθεσίας.'),
    );
  }

  submit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.usernameTaken.set(false);

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const dto: RegisterDto = {
      username: value.username,
      password: value.password,
      confirmPassword: value.confirmPassword,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      address: value.address,
      city: value.city,
      country: value.country,
      afm: value.afm,
    };
    // Οι συντεταγμένες είναι προαιρετικές: τις στέλνουμε μόνο αν συμπληρώθηκαν.
    if (value.latitude !== null && value.longitude !== null) {
      dto.latitude = value.latitude;
      dto.longitude = value.longitude;
    }

    this.authService.register(dto).subscribe({
      next: () => this.router.navigate(['/pending']),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(apiErrorMessage(error));
        // 409 Conflict: υπάρχει ήδη χρήστης με αυτό το username (ή email)
        if (error.status === 409 && this.errorMessage().includes('όνομα χρήστη')) {
          this.usernameTaken.set(true);
        }
      },
    });
  }
}
