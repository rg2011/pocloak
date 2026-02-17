import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { HttpExchange } from '../../core/api.types';
import { EndpointInspectorComponent } from '../../shared/endpoint-inspector.component';
import { navigateToQueryTab, resolveQueryTab } from '../../shared/query-tab-state';

const DISCOVERY_TABS = ['summary', 'discovery', 'realm', 'uma2'] as const;
type DiscoveryTab = (typeof DISCOVERY_TABS)[number];

@Component({
  standalone: true,
  imports: [CommonModule, EndpointInspectorComponent],
  template: `
    <article class="box">
      <h2 class="title is-5">Public Discovery Endpoints</h2>
      <div class="tabs is-boxed mb-4">
        <ul>
          <li [class.is-active]="activeTab() === 'summary'">
            <a (click)="selectTab('summary')">Summary</a>
          </li>
          <li [class.is-active]="activeTab() === 'discovery'">
            <a (click)="selectTab('discovery')">Discovery</a>
          </li>
          <li [class.is-active]="activeTab() === 'realm'">
            <a (click)="selectTab('realm')">Realm</a>
          </li>
          <li [class.is-active]="activeTab() === 'uma2'">
            <a (click)="selectTab('uma2')">UMA2</a>
          </li>
        </ul>
      </div>

      <div class="content" *ngIf="activeTab() === 'summary'">
        <p>This page groups public realm metadata endpoints and authorization-capability discovery endpoints.</p>
        <ul>
          <li>
            <strong><a (click)="selectTab('discovery')">Discovery</a>:</strong> fetches the OIDC well-known document with issuer capabilities and endpoints.
            <a href="https://openid.net/specs/openid-connect-discovery-1_0.html" target="_blank" rel="noreferrer">OIDC Discovery spec</a>.
          </li>
          <li>
            <strong><a (click)="selectTab('realm')">Realm</a>:</strong> reads public realm metadata derived from the discovery URL.
            <a href="https://www.keycloak.org/securing-apps/oidc-layers" target="_blank" rel="noreferrer">Keycloak OIDC layers</a>.
          </li>
          <li>
            <strong><a (click)="selectTab('uma2')">UMA2</a>:</strong> reads UMA2 well-known metadata for authorization and policy capabilities.
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
export class DiscoveryPageComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly activeTab = signal<DiscoveryTab>('summary');
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = resolveQueryTab(params.get('tab'), DISCOVERY_TABS, 'summary');
      void this.activateTab(tab);
    });
  }

  async selectTab(tab: DiscoveryTab): Promise<void> {
    if (tab === this.activeTab()) {
      return;
    }
    await navigateToQueryTab(this.router, this.route, tab);
  }

  private async activateTab(tab: DiscoveryTab): Promise<void> {
    this.activeTab.set(tab);

    if (tab === 'summary') {
      return;
    }

    if (tab === 'discovery') {
      await this.callEndpoint('/api/discovery/data', 'OIDC Discovery');
      return;
    }

    if (tab === 'realm') {
      await this.callEndpoint('/api/discovery/realm', 'Realm Metadata');
      return;
    }

    await this.callEndpoint('/api/discovery/uma2', 'UMA2 Well-Known');
  }

  async callEndpoint(url: string, title: string): Promise<void> {
    try {
      this.error.set('');
      this.title.set(title);
      const response = await firstValueFrom(this.http.get<HttpExchange>(url));
      this.exchange.set(response);
    } catch (error) {
      this.error.set('Error while calling public endpoint.');
    }
  }
}
