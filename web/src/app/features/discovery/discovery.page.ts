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
            <strong>Discovery:</strong> fetches the OIDC well-known document with issuer capabilities and endpoints.
            <a href="https://openid.net/specs/openid-connect-discovery-1_0.html" target="_blank" rel="noreferrer">OIDC Discovery spec</a>.
          </li>
          <li>
            <strong>Realm:</strong> reads public realm metadata derived from the discovery URL.
            <a href="https://www.keycloak.org/securing-apps/oidc-layers" target="_blank" rel="noreferrer">Keycloak OIDC layers</a>.
          </li>
          <li>
            <strong>UMA2:</strong> reads UMA2 well-known metadata for authorization and policy capabilities.
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
export class DiscoveryPageComponent {
  private readonly http = inject(HttpClient);
  readonly activeTab = signal<'summary' | 'discovery' | 'realm' | 'uma2'>('summary');
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

  async selectTab(tab: 'summary' | 'discovery' | 'realm' | 'uma2'): Promise<void> {
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
