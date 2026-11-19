import { Component, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';

// Εξαγωγή δεδομένων (μόνο admin). Το αίτημα στέλνεται με HttpClient ώστε να
// πάει το JWT, και το αποτέλεσμα κατεβαίνει ως αρχείο μέσω ενός προσωρινού link.
@Component({
  selector: 'app-admin-export-component',
  standalone: false,
  templateUrl: './admin-export-component.html',
})
export class AdminExportComponent {
  errorMessage = signal('');
  busy = signal(false);

  constructor(private http: HttpClient) {}

  download(format: 'json' | 'xml'): void {
    this.errorMessage.set('');
    this.busy.set(true);
    this.http
      .get(`${API_BASE_URL}/export`, { params: { format }, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `eventmanager.${format}`;
          link.click();
          URL.revokeObjectURL(url);
          this.busy.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.errorMessage.set('Η εξαγωγή απέτυχε (' + e.status + ').');
          this.busy.set(false);
        },
      });
  }
}
