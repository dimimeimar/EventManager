import { HttpErrorResponse } from '@angular/common/http';

// Βγάζει ένα μήνυμα προς τον χρήστη από το σφάλμα που επέστρεψε το NestJS.
// Το πεδίο message είναι string ή πίνακας από strings (σφάλματα validation).
export function apiErrorMessage(error: HttpErrorResponse): string {
  const message = error.error?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
}
