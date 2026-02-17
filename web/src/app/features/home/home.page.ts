import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box" *ngIf="message()">
      <p>{{ message() }}</p>
    </article>

    <article class="box">
      <h2 class="title is-5 mb-4">OIDC Flow</h2>
      <div class="tabs is-boxed mb-4">
        <ul>
          <li [class.is-active]="activeTab() === 'login-flow'">
            <a (click)="activeTab.set('login-flow')">Login flow</a>
          </li>
          <li [class.is-active]="activeTab() === 'access-flow'">
            <a (click)="activeTab.set('access-flow')">Access flow</a>
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

      <div class="content" *ngIf="activeTab() === 'login-flow'">
        <p><strong>Summary:</strong> Angular does not handle OIDC tokens directly. The Node backend owns login/callback/session.</p>
        <div class="mt-4">
          <svg viewBox="0 0 1200 760" role="img" aria-label="OIDC swimlane Browser Angular Backend Keycloak" style="width: 100%; height: auto;">
            <line x1="300" y1="50" x2="300" y2="740" stroke="#dbdbdb"></line>
            <line x1="600" y1="50" x2="600" y2="740" stroke="#dbdbdb"></line>
            <line x1="900" y1="50" x2="900" y2="740" stroke="#dbdbdb"></line>

            <rect x="45" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="345" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="645" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="945" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>

            <text x="150" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Browser</text>
            <text x="450" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Angular Web App</text>
            <text x="750" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Node Backend</text>
            <text x="1050" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Keycloak</text>

            <path d="M265 100 H450 V129" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M335 155 H150 V184" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M265 210 H750 V239" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M635 265 H150 V294" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M265 320 H1050 V349" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M935 375 H150 V404" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M265 430 H750 V459" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M865 485 H1050 V514" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M935 540 H750 V569" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M635 595 H150 V624" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>
            <path d="M265 650 H450 V679" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)"></path>

            <rect x="35" y="78" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="106" text-anchor="middle" font-size="14">1. Browse login page</text>

            <rect x="335" y="133" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="161" text-anchor="middle" font-size="14">2. Redirect browser to /login</text>

            <rect x="35" y="188" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="216" text-anchor="middle" font-size="14">3. GET /login</text>

            <rect x="635" y="243" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="271" text-anchor="middle" font-size="14">4. state/nonce/PKCE + auth URL</text>

            <rect x="35" y="298" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="326" text-anchor="middle" font-size="14">5. Follow redirect to Keycloak</text>

            <rect x="935" y="353" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="1050" y="381" text-anchor="middle" font-size="14">6. Login + redirect with code</text>

            <rect x="35" y="408" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="436" text-anchor="middle" font-size="14">7. GET /auth/callback?code=...</text>

            <rect x="635" y="463" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="491" text-anchor="middle" font-size="14">8. Exchange code at token endpoint</text>

            <rect x="935" y="518" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="1050" y="546" text-anchor="middle" font-size="14">9. Return tokens</text>

            <rect x="635" y="573" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="601" text-anchor="middle" font-size="14">10. Save session + redirect /</text>

            <rect x="35" y="628" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="656" text-anchor="middle" font-size="14">11. GET / (home)</text>

            <rect x="335" y="683" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="711" text-anchor="middle" font-size="14">12. Render /home</text>

            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <path d="M0,0 L10,4 L0,8 z" fill="#d97706"></path>
              </marker>
            </defs>
          </svg>
        </div>
        <div class="mt-4">
          <p><strong>Notes:</strong></p>
          <ul>
            <li>Real tokens are stored only in backend session state.</li>
            <li>Angular checks auth state via <code>/api/auth/status</code> and consumes protected APIs.</li>
            <li>Angular never calls Keycloak directly in this flow.</li>
          </ul>
        </div>
      </div>

      <div class="content" *ngIf="activeTab() === 'access-flow'">
        <p><strong>Summary:</strong> for protected routes, Angular validates session state and backend validates/refreshes token before calling Keycloak.</p>
        <div class="mt-4">
          <svg viewBox="0 0 1200 720" role="img" aria-label="Protected access swimlane Browser Angular Backend Keycloak" style="width: 100%; height: auto;">
            <line x1="300" y1="50" x2="300" y2="700" stroke="#dbdbdb"></line>
            <line x1="600" y1="50" x2="600" y2="700" stroke="#dbdbdb"></line>
            <line x1="900" y1="50" x2="900" y2="700" stroke="#dbdbdb"></line>

            <rect x="45" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="345" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="645" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>
            <rect x="945" y="8" width="210" height="30" rx="4" fill="#ebebeb" stroke="#d9d9d9"></rect>

            <text x="150" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Browser</text>
            <text x="450" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Angular Web App</text>
            <text x="750" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Node Backend</text>
            <text x="1050" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="#111111">Keycloak</text>

            <path d="M265 100 H450 V129" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M565 155 H750 V184" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M635 210 H450 V239" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M450 287 V294" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M450 342 V349" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M565 375 H750 V404" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M865 430 H1050 V459" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M935 485 H750 V514" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M635 540 H450 V569" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>
            <path d="M335 595 H150 V624" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-access)"></path>

            <rect x="35" y="78" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="106" text-anchor="middle" font-size="14">1. Open /oidc (protected route)</text>

            <rect x="335" y="133" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="161" text-anchor="middle" font-size="14">2. Angular AuthGuard runs</text>

            <rect x="635" y="188" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="216" text-anchor="middle" font-size="14">3. GET /api/auth/status</text>

            <rect x="335" y="243" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="271" text-anchor="middle" font-size="14">4. Auth status received</text>

            <rect x="335" y="298" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="326" text-anchor="middle" font-size="14">5. If unauthenticated, redirect /</text>

            <rect x="335" y="353" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="381" text-anchor="middle" font-size="14">6. If authenticated, call /api/oidc/*</text>

            <rect x="635" y="408" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="436" text-anchor="middle" font-size="14">7. Backend guard + refresh check</text>

            <rect x="935" y="463" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="1050" y="491" text-anchor="middle" font-size="14">8. Keycloak endpoint response</text>

            <rect x="635" y="518" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="750" y="546" text-anchor="middle" font-size="14">9. Return sanitized API payload</text>

            <rect x="335" y="573" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="450" y="601" text-anchor="middle" font-size="14">10. Angular renders endpoint data</text>

            <rect x="35" y="628" width="230" height="44" rx="4" fill="#f5f5f5" stroke="#dbdbdb"></rect>
            <text x="150" y="656" text-anchor="middle" font-size="14">11. Browser updates UI</text>

            <defs>
              <marker id="arrow-access" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <path d="M0,0 L10,4 L0,8 z" fill="#d97706"></path>
              </marker>
            </defs>
          </svg>
        </div>
        <div class="mt-4">
          <p><strong>Notes:</strong></p>
          <ul>
            <li>If no session exists, Angular blocks the protected route and redirects to Home.</li>
            <li>When calling <code>/api/oidc/*</code>, backend applies <code>authGuard</code> and then refresh middleware when needed.</li>
            <li>If refresh succeeds, backend updates the session and continues the Keycloak call.</li>
          </ul>
        </div>
      </div>

      <div class="content" *ngIf="activeTab() === 'frontend'">
        <p><strong>Stack:</strong> Angular standalone + Router + HttpClient + Bulma (CDN).</p>
        <ul>
          <li>
            Main route navigation:
            <code>home</code>, <code>discovery</code>, <code>oidc</code>, <code>tokens</code>, <code>session</code>,
            <code>config</code>.
          </li>
          <li><code>AuthGuard</code> protects private routes by checking backend session state.</li>
          <li><code>HttpInterceptor</code> handles <code>401</code> and navigates back to home/login.</li>
          <li>Reusable HTTP inspector component shows request/reply payloads for OIDC endpoints.</li>
          <li>UI stays intentionally simple: semantic HTML + Bulma, no custom CSS layers.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'backend'">
        <p><strong>Stack:</strong> Node 20 + Express + express-session + openid-client.</p>
        <ul>
          <li>BFF architecture with server-side tokens: browser never receives refresh token.</li>
          <li>Public APIs under <code>/api</code> for discovery, config, and auth status.</li>
          <li>Protected APIs use backend guard + server-side refresh middleware.</li>
          <li><code>/api/config</code> saves JSON config; <code>/api/config/restart</code> restarts the process.</li>
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
    </article>
  `
})
export class HomePageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly message = computed(() => this.route.snapshot.queryParamMap.get('message') || '');
  readonly activeTab = signal<'login-flow' | 'access-flow' | 'frontend' | 'backend' | 'keycloak'>('login-flow');
}
