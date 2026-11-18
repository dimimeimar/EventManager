import { Pipe, PipeTransform } from '@angular/core';

// Μετατρέπει την κατάσταση της εκδήλωσης σε ελληνικό κείμενο.
@Pipe({ name: 'eventStatus', standalone: false })
export class EventStatusPipe implements PipeTransform {
  transform(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Πρόχειρη';
      case 'PUBLISHED':
        return 'Δημοσιευμένη';
      case 'COMPLETED':
        return 'Ολοκληρωμένη';
      case 'CANCELLED':
        return 'Ακυρωμένη';
      default:
        return status;
    }
  }
}
