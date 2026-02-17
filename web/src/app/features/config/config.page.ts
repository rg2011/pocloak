import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box">
      <h2 class="title is-5">OIDC Configuration</h2>
      <p class="mb-4">Current configuration loaded from environment variables. To change, edit your <code>.env</code> file and restart the server.</p>

      <div class="content" *ngIf="config()">
        <table class="table is-fullwidth is-striped">
          <tbody>
            <tr>
              <th>Discovery URL</th>
              <td><code>{{ config().discoveryUrl || '(not set)' }}</code></td>
            </tr>
            <tr>
              <th>Client ID</th>
              <td><code>{{ config().clientId || '(not set)' }}</code></td>
            </tr>
            <tr>
              <th>Client Secret</th>
              <td><code>{{ config().clientSecret ? '[configured]' : '(not set)' }}</code></td>
            </tr>
            <tr>
              <th>Use PKCE</th>
              <td><code>{{ config().usePkce }}</code></td>
            </tr>
            <tr>
              <th>PKCE Method</th>
              <td><code>{{ config().pkceMethod }}</code></td>
            </tr>
            <tr>
              <th>App Domain</th>
              <td><code>{{ config().domain }}</code></td>
            </tr>
            <tr>
              <th>Scope</th>
              <td><code>{{ config().scope }}</code></td>
            </tr>
            <tr>
              <th>UMA Audience</th>
              <td><code>{{ config().umaAudience || '(not set)' }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="notification is-info is-light mt-4">
        <p><strong>How to configure:</strong></p>
        <ol>
          <li>Copy <code>.env.example</code> to <code>.env</code></li>
          <li>Edit the values in <code>.env</code></li>
          <li>Restart the server: <code>npm start</code></li>
        </ol>
      </div>

      <p class="has-text-danger" *ngIf="error()">{{ error() }}</p>
    </article>
  `
})
export class ConfigPageComponent {
  private readonly http = inject(HttpClient);
  readonly config = signal<any>(null);
  readonly error = signal('');

  constructor() {
    void this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get('/api/config'));
      this.config.set(response);
    } catch (error) {
      this.error.set('Could not load configuration.');
    }
  }
}
