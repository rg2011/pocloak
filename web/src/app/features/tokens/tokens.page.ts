import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box">
      <h2 class="title is-5">Safe Token View</h2>
      <button class="button is-link mb-3" (click)="reload()">Reload</button>

      <div class="content" *ngIf="tokens() as t">
        <p><strong>Token type:</strong> {{ readText(t, 'tokenType') }}</p>
        <p><strong>Scope:</strong> {{ readText(t, 'scope') }}</p>
        <p><strong>Expires at:</strong> {{ readText(t, 'expiresAt') }}</p>
        <p>
          <strong>Refresh token in session:</strong>
          {{ readBool(t, 'hasRefreshToken') ? 'yes' : 'no' }}
        </p>
      </div>
    </article>

    <article class="box" *ngIf="tokens() as t">
      <h3 class="title is-6">ID Token Claims</h3>
      <pre>{{ pretty(readObj(t, 'idTokenClaims')) }}</pre>
    </article>

    <article class="box" *ngIf="tokens() as t">
      <h3 class="title is-6">Access Token Claims</h3>
      <pre>{{ pretty(readObj(t, 'accessTokenClaims')) }}</pre>
    </article>
  `
})
export class TokensPageComponent {
  private readonly http = inject(HttpClient);
  readonly tokens = signal<unknown>(null);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    const response = await firstValueFrom(this.http.get('/api/tokens'));
    this.tokens.set(response);
  }

  pretty(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  readObj(source: unknown, key: string): unknown {
    if (!source || typeof source !== 'object') {
      return null;
    }

    const value = (source as Record<string, unknown>)[key];
    return typeof value === 'undefined' ? null : value;
  }

  readText(source: unknown, key: string): string {
    const value = this.readObj(source, key);
    if (value === null) {
      return '(none)';
    }

    return String(value);
  }

  readBool(source: unknown, key: string): boolean {
    return Boolean(this.readObj(source, key));
  }
}
