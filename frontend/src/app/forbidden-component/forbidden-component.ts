import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden-component',
  standalone: false,
  template: `
    <section class="narrow">
      <div class="card center">
        <h2>Δεν επιτρέπεται η πρόσβαση</h2>
        <p>Ο λογαριασμός σου δεν έχει τα απαραίτητα δικαιώματα για αυτή τη σελίδα.</p>
        <a class="button" routerLink="/">Επιστροφή</a>
      </div>
    </section>
  `,
})
export class ForbiddenComponent {}
