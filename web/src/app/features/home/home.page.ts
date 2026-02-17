import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box" *ngIf="message()">
      <p>{{ message() }}</p>
    </article>

    <article class="box">
      <h2 class="title is-5 mb-4">Overview</h2>
      <div class="tabs is-boxed mb-4">
        <ul>
          <li [class.is-active]="activeTab() === 'config'">
            <a (click)="activeTab.set('config')">Config</a>
          </li>
          <li [class.is-active]="activeTab() === 'idp-hint'">
            <a (click)="activeTab.set('idp-hint')">IdP Hint</a>
          </li>
          <li [class.is-active]="activeTab() === 'frontend'">
            <a (click)="activeTab.set('frontend')">Frontend</a>
          </li>
          <li [class.is-active]="activeTab() === 'backend'">
            <a (click)="activeTab.set('backend')">Backend</a>
          </li>
          <li [class.is-active]="activeTab() === 'keycloak'">
            <a (click)="activeTab.set('keycloak')">Keycloak Hints</a>
          </li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'config'">
        <p class="mb-4">Current configuration loaded from environment variables. To change, edit your <code>.env</code> file and restart the server.</p>

        <table class="table is-fullwidth is-striped" *ngIf="config()">
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
            <tr>
              <th>Trusted IdP Claim</th>
              <td><code>{{ config().trustedIdpClaim || '(not set)' }}</code></td>
            </tr>
            <tr>
              <th>Realm Base URL</th>
              <td><code>{{ config().realmBaseUrl || '(derived from discovery URL)' }}</code></td>
            </tr>
            <tr>
              <th>Raw Token Export (training)</th>
              <td><code>{{ config().enableRawTokenExport }}</code></td>
            </tr>
          </tbody>
        </table>

        <div class="box">
          <p><strong>How to configure:</strong></p>
          <ol>
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Edit the values in <code>.env</code></li>
            <li>Restart the server: <code>npm start</code></li>
          </ol>
        </div>

        <p class="has-text-danger" *ngIf="error()">{{ error() }}</p>
      </div>

      <div class="content" *ngIf="activeTab() === 'frontend'">
        <p><strong>Stack:</strong> Angular standalone + Router + HttpClient + Bulma (CDN).</p>
        <ul>
          <li>
            Main route navigation:
            <code>home</code>, <code>flows</code>, <code>discovery</code>, <code>oidc</code>, <code>tokens</code>, <code>session</code>.
          </li>
          <li>
            <a href="https://angular.dev/api/router/CanActivateFn" target="_blank" rel="noreferrer">AuthGuard</a> protects private routes by checking backend session state.
          </li>
          <li>
            <a href="https://angular.dev/api/common/http/HttpInterceptorFn" target="_blank" rel="noreferrer">HttpInterceptor</a> handles <code>401</code> and navigates back to home/login.
          </li>
          <li>Reusable HTTP inspector component shows request/reply payloads for OIDC endpoints.</li>
          <li>UI stays intentionally simple: semantic HTML + <a href="https://bulma.io/" target="_blank" rel="noreferrer">Bulma</a>, no custom CSS layers.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'backend'">
        <p><strong>Stack:</strong> Node 20 + <a href="https://expressjs.com/" target="_blank" rel="noreferrer">Express</a> + <a href="https://github.com/expressjs/session" target="_blank" rel="noreferrer">express-session</a> + <a href="https://github.com/panva/openid-client" target="_blank" rel="noreferrer">openid-client</a>.</p>
        <ul>
          <li>BFF architecture with server-side tokens: browser never receives refresh token.</li>
          <li>Public APIs under <code>/api</code> for discovery, config, and auth status.</li>
          <li>Protected APIs use backend guard + server-side refresh middleware.</li>
          <li><code>/api/config</code> returns runtime config loaded from environment variables.</li>
          <li>Sensitive fields are sanitized before returning data to the UI.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'keycloak'">
        <ul>
          <li>Configure your client redirect URI to point to <code>/auth/callback</code>.</li>
          <li>If no <code>clientSecret</code> is provided, auth method is <code>none</code>.</li>
          <li>With <code>clientSecret</code>, backend uses <code>client_secret_basic</code> for token/introspect calls.</li>
          <li>UMA behavior depends on real permissions and configured audience in Keycloak.</li>
          <li>If <code>discoveryUrl</code> changes, keep <code>/.well-known/</code> so realm metadata can be derived.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'idp-hint'">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">Multi-tenancy with multiple IdP (Identity Providers)</p>
          </header>
          <div class="card-content">
            <ol>
              <li>User writes a value in login modal (for example <code>kc-tools</code>).</li>
              <li>Frontend redirects to <code>/login?kc_idp_hint=kc-tools</code>.</li>
              <li>Backend forwards <code>kc_idp_hint</code> to Keycloak authorization URL.</li>
              <li>After callback, backend reads a configured claim from access token (<code>OIDC_TRUSTED_IDP_CLAIM</code>).</li>
              <li>Claim value is stored as trusted <code>validatedIdp</code> in session (for example <code>tools</code>).</li>
            </ol>
            <p>
              In Keycloak, this can be configured with an IdP mapper type <code>Hardcoded User Session Attribute</code>, setting
              the session attribute used by <code>OIDC_TRUSTED_IDP_CLAIM</code>.
            </p>
            <p class="has-text-grey mt-2">
              Example mapper (obfuscated): alias hint <code>kc-tools</code>, trusted claim value <code>tools</code>.
            </p>
          </div>
          <div class="card-image">
            <figure class="image">
              <img
                src="assets/idp-session-mapper-obfuscated.png"
                alt="Example Keycloak IdP mapper with obfuscated id and hardcoded session attribute value"
                style="width: 80%; margin: 0 auto;"
              />
            </figure>
          </div>
        </div>
      </div>
    </article>
  `
})
export class HomePageComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly message = computed(() => this.route.snapshot.queryParamMap.get('message') || '');
  readonly activeTab = signal<'config' | 'frontend' | 'backend' | 'keycloak' | 'idp-hint'>('config');
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
