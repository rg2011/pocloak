import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpExchange } from '../../core/api.types';
import { EndpointInspectorComponent } from '../../shared/endpoint-inspector.component';

@Component({
  standalone: true,
  imports: [CommonModule, EndpointInspectorComponent],
  template: `
    <article class="box">
      <h2 class="title is-5">Protected OIDC Endpoints</h2>
      <div class="tabs is-boxed mb-4">
        <ul>
          <li [class.is-active]="activeTab() === 'summary'">
            <a (click)="selectTab('summary')">Summary</a>
          </li>
          <li [class.is-active]="activeTab() === 'userinfo'">
            <a (click)="selectTab('userinfo')">Userinfo</a>
          </li>
          <li [class.is-active]="activeTab() === 'introspect'">
            <a (click)="selectTab('introspect')">Introspect</a>
          </li>
          <li [class.is-active]="activeTab() === 'uma'">
            <a (click)="selectTab('uma')">UMA</a>
          </li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'summary'">
        <p>Esta página contiene endpoints protegidos que requieren sesión autenticada y access token válido.</p>
        <ul>
          <li>
            <strong>Userinfo:</strong> consulta claims del usuario autenticado usando bearer token.
            <a href="https://openid.net/specs/openid-connect-core-1_0.html#UserInfo" target="_blank" rel="noreferrer">OIDC UserInfo</a>.
          </li>
          <li>
            <strong>Introspect:</strong> valida estado/claims de un token en el authorization server.
            <a href="https://datatracker.ietf.org/doc/html/rfc7662" target="_blank" rel="noreferrer">RFC 7662 Token Introspection</a>.
          </li>
          <li>
            <strong>UMA:</strong> solicita ticket/decision de autorización con grant UMA.
            <a href="https://www.keycloak.org/docs/latest/authorization_services/" target="_blank" rel="noreferrer">Keycloak Authorization Services</a>.
          </li>
        </ul>
      </div>

      <p *ngIf="error() && activeTab() !== 'summary'">{{ error() }}</p>
    </article>

    <app-endpoint-inspector
      *ngIf="activeTab() !== 'summary' && exchange()"
      [title]="title()"
      [exchange]="exchange()"
    ></app-endpoint-inspector>
  `
})
export class OidcPageComponent {
  private readonly http = inject(HttpClient);
  readonly activeTab = signal<'summary' | 'userinfo' | 'introspect' | 'uma'>('summary');
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

  async selectTab(tab: 'summary' | 'userinfo' | 'introspect' | 'uma'): Promise<void> {
    this.activeTab.set(tab);

    if (tab === 'summary') {
      return;
    }

    if (tab === 'userinfo') {
      await this.callEndpoint('/api/oidc/userinfo', 'Userinfo');
      return;
    }

    if (tab === 'introspect') {
      await this.callEndpoint('/api/oidc/introspect', 'Introspect');
      return;
    }

    await this.callEndpoint('/api/oidc/uma', 'UMA Ticket');
  }

  async callEndpoint(url: string, title: string): Promise<void> {
    try {
      this.error.set('');
      this.title.set(title);
      const response = await firstValueFrom(this.http.get<HttpExchange>(url));
      this.exchange.set(response);
    } catch (error) {
      this.error.set('Error llamando endpoint protegido. ¿Hay sesión activa?');
    }
  }
}
