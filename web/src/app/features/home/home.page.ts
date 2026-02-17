import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box" *ngIf="message()">
      <p>{{ message() }}</p>
    </article>

    <article class="box">
      <h2 class="title is-5 mb-4">Flujo OIDC</h2>
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
        <p><strong>Resumen:</strong> Angular no maneja tokens OIDC directamente. El backend Node gestiona login/callback/sesión.</p>
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
          <p><strong>Notas:</strong></p>
          <ul>
            <li>Tokens reales se guardan solo en sesión del backend.</li>
            <li>Angular consulta estado vía <code>/api/auth/status</code> y consume APIs protegidas.</li>
            <li>Keycloak nunca es llamado directamente desde Angular en este flujo.</li>
          </ul>
        </div>
      </div>

      <div class="content" *ngIf="activeTab() === 'access-flow'">
        <p><strong>Resumen:</strong> al entrar en rutas protegidas, Angular valida sesión y backend valida/renueva token antes de llamar a Keycloak.</p>
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
          <p><strong>Notas:</strong></p>
          <ul>
            <li>Si no hay sesión, Angular no entra en la ruta protegida y redirige a Home.</li>
            <li>Al llamar <code>/api/oidc/*</code>, backend aplica <code>authGuard</code> y luego refresh automático si toca.</li>
            <li>Si refresh funciona, backend actualiza sesión y continúa la llamada a Keycloak.</li>
          </ul>
        </div>
      </div>

      <div class="content" *ngIf="activeTab() === 'frontend'">
        <p><strong>Stack:</strong> Angular standalone + Router + HttpClient + Bulma (CDN).</p>
        <ul>
          <li>
            Navegación principal por rutas:
            <code>home</code>, <code>discovery</code>, <code>oidc</code>, <code>tokens</code>, <code>session</code>,
            <code>config</code>.
          </li>
          <li><code>AuthGuard</code> en rutas privadas para validar sesión backend antes de entrar.</li>
          <li><code>HttpInterceptor</code> para capturar <code>401</code> y volver a home/login.</li>
          <li>Componente reutilizable de inspección HTTP para request/reply de endpoints OIDC.</li>
          <li>UI deliberadamente simple: semántica HTML + componentes Bulma sin CSS custom.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'backend'">
        <p><strong>Stack:</strong> Node 20 + Express + express-session + openid-client.</p>
        <ul>
          <li>BFF con tokens en sesión servidor: el browser no recibe refresh token.</li>
          <li>Rutas API públicas bajo <code>/api</code> para discovery, config y estado de auth.</li>
          <li>Rutas API protegidas con guard + refresh interceptor server-side.</li>
          <li><code>/api/config</code> guarda JSON de configuración; <code>/api/config/restart</code> reinicia proceso.</li>
          <li>Sanitización de datos sensibles en headers/cuerpos antes de mostrarlos en UI.</li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'keycloak'">
        <ul>
          <li>Configura el cliente con redirect URI apuntando a <code>/auth/callback</code>.</li>
          <li>Si no hay <code>clientSecret</code>, la app usa auth method <code>none</code>.</li>
          <li>Con <code>clientSecret</code>, se usa <code>client_secret_basic</code> en token/introspect.</li>
          <li>La llamada UMA depende de permisos reales y audience configurada en Keycloak.</li>
          <li>Si cambia <code>discoveryUrl</code>, revisa que incluya <code>/.well-known/</code> para derivar realm metadata.</li>
        </ul>
      </div>
    </article>
  `
})
export class HomePageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);
  readonly message = computed(() => this.route.snapshot.queryParamMap.get('message') || '');
  readonly activeTab = signal<'login-flow' | 'access-flow' | 'frontend' | 'backend' | 'keycloak'>('login-flow');
}
