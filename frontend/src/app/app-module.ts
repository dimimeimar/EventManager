import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AuthInterceptor } from './auth/auth.interceptor';
import { WelcomeComponent } from './welcome-component/welcome-component';
import { RegisterComponent } from './register-component/register-component';
import { PendingComponent } from './pending-component/pending-component';
import { HomeComponent } from './home-component/home-component';
import { AdminUsersComponent } from './admin-users-component/admin-users-component';
import { AdminUserDetailsComponent } from './admin-user-details-component/admin-user-details-component';
import { ForbiddenComponent } from './forbidden-component/forbidden-component';
import { NotFoundComponent } from './not-found-component/not-found-component';
import { UserStatusPipe } from './user-status-pipe';
import { EventStatusPipe } from './event-status-pipe';
import { MyEventsComponent } from './my-events-component/my-events-component';
import { EventFormComponent } from './event-form-component/event-form-component';
import { EventDetailsComponent } from './event-details-component/event-details-component';

@NgModule({
  declarations: [
    App,
    WelcomeComponent,
    RegisterComponent,
    PendingComponent,
    HomeComponent,
    AdminUsersComponent,
    AdminUserDetailsComponent,
    ForbiddenComponent,
    NotFoundComponent,
    UserStatusPipe,
    EventStatusPipe,
    MyEventsComponent,
    EventFormComponent,
    EventDetailsComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}
