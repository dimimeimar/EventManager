import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { UsersApiService } from '../users-api.service';
import { PublicUserDto } from '../model/public-user.dto';
import { apiErrorMessage } from '../api-error';

// Σελίδα στοιχείων ενός χρήστη. Αν η αίτησή του εκκρεμεί,
// ο διαχειριστής μπορεί να την εγκρίνει ή να την απορρίψει.
@Component({
  selector: 'app-admin-user-details-component',
  standalone: false,
  templateUrl: './admin-user-details-component.html',
})
export class AdminUserDetailsComponent implements OnInit {
  user = signal<PublicUserDto | null>(null);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private usersApi: UsersApiService,
  ) {}

  ngOnInit(): void {
    // Το id έρχεται από το route: /admin/users/:id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.usersApi.findOne(id).subscribe({
      next: (user) => this.user.set(user),
      error: (error: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(error)),
    });
  }

  approve(user: PublicUserDto): void {
    this.changeStatus(this.usersApi.approve(user.id));
  }

  reject(user: PublicUserDto): void {
    if (!confirm(`Να απορριφθεί η αίτηση του χρήστη ${user.username};`)) {
      return;
    }
    this.changeStatus(this.usersApi.reject(user.id));
  }

  // Το backend επιστρέφει τον ενημερωμένο χρήστη, οπότε απλά τον ξαναδείχνουμε.
  private changeStatus(request: Observable<PublicUserDto>): void {
    this.errorMessage.set('');
    request.subscribe({
      next: (updated) => this.user.set(updated),
      error: (error: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(error)),
    });
  }
}
