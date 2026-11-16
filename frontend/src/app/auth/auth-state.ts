// Η κατάσταση σύνδεσης που χρησιμοποιούν τα components, τα guards και τα templates.
export interface AuthState {
  authenticated: boolean;
  username: string | null;
  roles: string[];
}
