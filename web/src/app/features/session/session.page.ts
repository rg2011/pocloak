import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box">
      <h2 class="title is-5">Session Snapshot</h2>
      <button class="button is-link mb-3" (click)="reload()">Reload</button>
      <pre>{{ pretty(session()) }}</pre>
    </article>
  `
})
export class SessionPageComponent {
  private readonly http = inject(HttpClient);
  readonly session = signal<unknown>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    const response = await firstValueFrom(this.http.get('/api/session'));
    this.session.set(response);
  }

  pretty(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
