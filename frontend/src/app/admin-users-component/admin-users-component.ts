import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersApiService } from '../users-api.service';
import { PublicUserDto } from '../model/public-user.dto';
import { apiErrorMessage } from '../api-error';

// Σελίδα διαχείρισης χρηστών: λίστα όλων των χρηστών με φίλτρο κατάστασης.
@Component({
  selector: 'app-admin-users-component',
  standalone: false,
  templateUrl: './admin-users-component.html',
})
export class AdminUsersComponent implements OnInit {
  users = signal<PublicUserDto[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // '' = όλοι οι χρήστες
  statusFilter = '';

  constructor(private usersApi: UsersApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  changeFilter(status: string): void {
    this.statusFilter = status;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.usersApi.findAll(this.statusFilter).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(apiErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
