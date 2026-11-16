import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found-component',
  standalone: false,
  template: `
    <section class="narrow">
      <div class="card center">
        <h2>Η σελίδα δεν βρέθηκε</h2>
        <a class="button" routerLink="/">Επιστροφή</a>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
