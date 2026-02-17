import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { HttpExchange } from '../../core/api.types';
import { EndpointInspectorComponent } from '../../shared/endpoint-inspector.component';
import { navigateToQueryTab, resolveQueryTab } from '../../shared/query-tab-state';

const OIDC_TABS = ['summary', 'userinfo', 'introspect', 'uma'] as const;
type OidcTab = (typeof OIDC_TABS)[number];

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly activeTab = signal<OidcTab>('summary');
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = resolveQueryTab(params.get('tab'), OIDC_TABS, 'summary');
      void this.activateTab(tab);
    });
  }

  async selectTab(tab: OidcTab): Promise<void> {
    if (tab === this.activeTab()) {
      return;
    }
    await navigateToQueryTab(this.router, this.route, tab);
  }

  private async activateTab(tab: OidcTab): Promise<void> {
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
      this.error.set('Error while calling protected endpoint. Is session active?');
    }
  }
}
