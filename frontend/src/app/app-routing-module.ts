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
import { MyBookingsComponent } from './my-bookings-component/my-bookings-component';
import { MessagesComponent } from './messages-component/messages-component';
import { AdminExportComponent } from './admin-export-component/admin-export-component';
import { RecommendationsComponent } from './recommendations-component/recommendations-component';
import { AdminEvaluationComponent } from './admin-evaluation-component/admin-evaluation-component';
import { SearchComponent } from './search-component/search-component';
import { MyEventsComponent } from './my-events-component/my-events-component';
import { EventFormComponent } from './event-form-component/event-form-component';
import { EventDetailsComponent } from './event-details-component/event-details-component';
import { ForbiddenComponent } from './forbidden-component/forbidden-component';
import { NotFoundComponent } from './not-found-component/not-found-component';

const routes: Routes = [
  // Δημόσιες σελίδες
  { path: '', component: WelcomeComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'pending', component: PendingComponent },

  // Χρειάζεται σύνδεση (χρήστης, διαχειριστής ή επισκέπτης με token)
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },

  // Αναζήτηση εκδηλώσεων (όλοι οι συνδεδεμένοι, και ο επισκέπτης)
  { path: 'events', component: SearchComponent, canActivate: [AuthGuard] },

  {
    path: 'bookings',
    component: MyBookingsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] },
  },

  {
    path: 'messages',
    component: MessagesComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] },
  },

  // Διαχείριση εκδηλώσεων από τον διοργανωτή (ρόλος user).
  // Η σειρά μετράει: τα 'mine' και 'new' πρέπει να μπουν πριν το ':id'.
  {
    path: 'events/mine',
    component: MyEventsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'events/new',
    component: EventFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'events/:id/edit',
    component: EventFormComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user', 'admin'] },
  },
  { path: 'events/:id', component: EventDetailsComponent, canActivate: [AuthGuard] },

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

  {
    path: 'admin/export',
    component: AdminExportComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'recommendations',
    component: RecommendationsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'admin/evaluation',
    component: AdminEvaluationComponent,
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
