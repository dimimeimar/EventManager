import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { WelcomeComponent } from './welcome-component/welcome-component';
import { RegisterComponent } from './register-component/register-component';
import { PendingComponent } from './pending-component/pending-component';
import { HomeComponent } from './home-component/home-component';
import { AdminUsersComponent } from './admin-users-component/admin-users-component';
import { AdminUserDetailsComponent } from './admin-user-details-component/admin-user-details-component';
import { ForbiddenComponent } from './forbidden-component/forbidden-component';
import { NotFoundComponent } from './not-found-component/not-found-component';

const routes: Routes = [
  // Δημόσιες σελίδες
  { path: '', component: WelcomeComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'pending', component: PendingComponent },

  // Χρειάζεται σύνδεση (χρήστης, διαχειριστής ή επισκέπτης με token)
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },

  // Μόνο για τον διαχειριστή
  {
    path: 'admin/users',
    component: AdminUsersComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/users/:id',
    component: AdminUserDetailsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },

  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
