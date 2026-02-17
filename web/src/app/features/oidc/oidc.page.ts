import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { HttpExchange } from '../../core/api.types';
import { EndpointInspectorComponent } from '../../shared/endpoint-inspector.component';
import { EndpointTabSpec, fetchEndpointTab } from '../../shared/endpoint-tab.helper';

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
        <p>This page contains protected endpoints that require an authenticated session and valid access token.</p>
        <ul>
          <li>
            <strong><a (click)="selectTab('userinfo')">Userinfo</a>:</strong> reads user claims for the authenticated subject using bearer token.
            <a href="https://openid.net/specs/openid-connect-core-1_0.html#UserInfo" target="_blank" rel="noreferrer">OIDC UserInfo</a>.
          </li>
          <li>
            <strong><a (click)="selectTab('introspect')">Introspect</a>:</strong> validates token state/claims against the authorization server.
            <a href="https://datatracker.ietf.org/doc/html/rfc7662" target="_blank" rel="noreferrer">RFC 7662 Token Introspection</a>.
          </li>
          <li>
            <strong><a (click)="selectTab('uma')">UMA</a>:</strong> requests authorization ticket/decision using UMA grant.
            <a href="https://www.keycloak.org/docs/latest/authorization_services/" target="_blank" rel="noreferrer">Keycloak Authorization Services</a>.
          </li>
        </ul>
      </div>

      <p *ngIf="error() && activeTab() !== 'summary'">{{ error() }}</p>

      <app-endpoint-inspector
        *ngIf="activeTab() !== 'summary' && exchange()"
        [title]="title()"
        [exchange]="exchange()"
      ></app-endpoint-inspector>
    </article>
  `
})
export class OidcPageComponent {
  private readonly http = inject(HttpClient);
  private readonly endpointByTab: Record<'userinfo' | 'introspect' | 'uma', EndpointTabSpec> = {
    userinfo: { url: '/api/oidc/userinfo', title: 'Userinfo' },
    introspect: { url: '/api/oidc/introspect', title: 'Introspect' },
    uma: { url: '/api/oidc/uma', title: 'UMA Ticket' }
  };
  readonly activeTab = signal<'summary' | 'userinfo' | 'introspect' | 'uma'>('summary');
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

  async selectTab(tab: 'summary' | 'userinfo' | 'introspect' | 'uma'): Promise<void> {
    this.activeTab.set(tab);

    if (tab === 'summary') {
      return;
    }

    try {
      this.error.set('');
      const result = await fetchEndpointTab(this.http, this.endpointByTab, tab);
      if (!result) {
        return;
      }
      this.title.set(result.title);
      this.exchange.set(result.exchange);
    } catch (error) {
      this.error.set('Error while calling protected endpoint. Is session active?');
    }
  }
}
