import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthState } from '../auth/auth-state';

// Αρχική σελίδα μετά την είσοδο. Από εδώ ο χρήστης πάει στη διαχείριση
// εκδηλώσεων ή στην αναζήτηση εκδηλώσεων.
@Component({
  selector: 'app-home-component',
  standalone: false,
  templateUrl: './home-component.html',
})
export class HomeComponent {
  authState$: Observable<AuthState>;

  constructor(private authService: AuthService) {
    this.authState$ = this.authService.state$;
  }
}
