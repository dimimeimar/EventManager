import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MessagesApiService } from '../messages-api.service';
import { MessageDto } from '../model/event.dto';
import { apiErrorMessage } from '../api-error';

// Εισερχόμενα, απεσταλμένα και σύνταξη νέου μηνύματος.
// Από τη σελίδα μιας εκδήλωσης έρχονται έτοιμα ο παραλήπτης και το θέμα (query params).
@Component({
  selector: 'app-messages-component',
  standalone: false,
  templateUrl: './messages-component.html',
})
export class MessagesComponent implements OnInit {
  tab = signal<'inbox' | 'sent' | 'compose'>('inbox');
  messages = signal<MessageDto[]>([]);
  selected = signal<MessageDto | null>(null);
  errorMessage = signal('');
  info = signal('');
  form: FormGroup;
  private eventId?: number;

  constructor(
    private fb: FormBuilder,
    private api: MessagesApiService,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      receiverUsername: ['', Validators.required],
      subject: ['', Validators.required],
      body: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('to')) {
      this.form.patchValue({ receiverUsername: q.get('to'), subject: q.get('subject') ?? '' });
      this.eventId = q.get('eventId') ? Number(q.get('eventId')) : undefined;
      this.tab.set('compose');
    } else {
      this.show('inbox');
    }
  }

  show(tab: 'inbox' | 'sent' | 'compose'): void {
    this.tab.set(tab);
    this.selected.set(null);
    this.errorMessage.set('');
    if (tab === 'compose') {
      return;
    }
    const request = tab === 'inbox' ? this.api.inbox() : this.api.sent();
    request.subscribe({
      next: (m) => this.messages.set(m),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  open(message: MessageDto): void {
    this.api.open(message.id).subscribe({
      next: (m) => {
        this.selected.set(m);
        // ενημέρωση της λίστας ώστε να φύγει το "νέο"
        this.messages.update((list) => list.map((x) => (x.id === m.id ? m : x)));
      },
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  remove(message: MessageDto): void {
    if (!confirm('Να διαγραφεί το μήνυμα;')) {
      return;
    }
    this.api.remove(message.id).subscribe({
      next: () => this.show(this.tab() === 'sent' ? 'sent' : 'inbox'),
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }

  reply(message: MessageDto): void {
    this.form.reset({
      receiverUsername: message.sender.username,
      subject: message.subject.startsWith('Re: ') ? message.subject : 'Re: ' + message.subject,
      body: '',
    });
    this.eventId = message.event?.id;
    this.tab.set('compose');
  }

  send(): void {
    this.errorMessage.set('');
    this.info.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.send({ ...this.form.value, eventId: this.eventId }).subscribe({
      next: () => {
        this.info.set('Το μήνυμα στάλθηκε.');
        this.form.reset({ receiverUsername: '', subject: '', body: '' });
        this.eventId = undefined;
      },
      error: (e: HttpErrorResponse) => this.errorMessage.set(apiErrorMessage(e)),
    });
  }
}
