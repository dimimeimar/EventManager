import { Pipe, PipeTransform } from '@angular/core';

// Μετατρέπει την κατάσταση χρήστη σε ελληνικό κείμενο, π.χ. {{ user.status | userStatus }}
@Pipe({
  name: 'userStatus',
  standalone: false,
})
export class UserStatusPipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Εκκρεμεί';
      case 'APPROVED':
        return 'Εγκεκριμένος';
      case 'REJECTED':
        return 'Απορρίφθηκε';
      default:
        return status;
    }
  }
}
