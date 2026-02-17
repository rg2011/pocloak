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
      <div class="buttons mb-3">
        <button class="button is-link" (click)="reload()">Reload</button>
        <button
          class="button"
          [class.is-danger]="canDownloadAccessToken()"
          [class.is-light]="canDownloadAccessToken()"
          [class.is-static]="!canDownloadAccessToken()"
          (click)="downloadAccessToken()"
          [disabled]="!canDownloadAccessToken()"
          [title]="canDownloadAccessToken() ? 'Opens raw access token in a new tab' : 'Enable OIDC_ENABLE_RAW_TOKEN_EXPORT=true to use this training feature'"
        >
          Download Access Token
        </button>
      </div>
      <p class="help mb-4">
        Training-only feature. Raw token export is
        <strong>{{ canDownloadAccessToken() ? 'enabled' : 'disabled' }}</strong>.
      </p>

      <div class="content" *ngIf="tokens() as t">
        <p><strong>Token type:</strong> {{ readText(t, 'tokenType') }}</p>
        <p><strong>Scope:</strong> {{ readText(t, 'scope') }}</p>
        <p><strong>Expires at:</strong> {{ readText(t, 'expiresAt') }}</p>
        <p>
          <strong>Refresh token in session:</strong>
          {{ readBool(t, 'hasRefreshToken') ? 'yes' : 'no' }}
        </p>

        <h3 class="title is-6 mt-5">ID Token Claims</h3>
        <pre>{{ pretty(readObj(t, 'idTokenClaims')) }}</pre>

        <h3 class="title is-6 mt-5">Access Token Claims</h3>
        <pre>{{ pretty(readObj(t, 'accessTokenClaims')) }}</pre>
      </div>
    </article>
  `
})
export class TokensPageComponent {
  private readonly http = inject(HttpClient);
  readonly tokens = signal<unknown>(null);
  readonly canDownloadAccessToken = signal(false);

  constructor() {
    void this.reload();
    void this.loadRawTokenExportFlag();
  }

  async reload(): Promise<void> {
    const response = await firstValueFrom(this.http.get('/api/tokens'));
    this.tokens.set(response);
  }

  async loadRawTokenExportFlag(): Promise<void> {
    try {
      const config = await firstValueFrom(this.http.get('/api/config'));
      const enabled = Boolean((config as Record<string, unknown>)['enableRawTokenExport']);
      this.canDownloadAccessToken.set(enabled);
    } catch {
      this.canDownloadAccessToken.set(false);
    }
  }

  downloadAccessToken(): void {
    if (!this.canDownloadAccessToken()) {
      return;
    }
    window.open('/api/tokens/access-token', '_blank', 'noopener');
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
