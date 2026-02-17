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
      <div class="buttons">
        <button class="button is-primary" (click)="callEndpoint('/api/oidc/userinfo', 'Userinfo')">Userinfo</button>
        <button class="button is-primary" (click)="callEndpoint('/api/oidc/introspect', 'Introspect')">Introspect</button>
        <button class="button is-primary" (click)="callEndpoint('/api/oidc/uma', 'UMA Ticket')">UMA</button>
      </div>
      <p *ngIf="error()">{{ error() }}</p>
    </article>

    <app-endpoint-inspector *ngIf="exchange()" [title]="title()" [exchange]="exchange()"></app-endpoint-inspector>
  `
})
export class OidcPageComponent {
  private readonly http = inject(HttpClient);
  readonly exchange = signal<HttpExchange | null>(null);
  readonly title = signal('');
  readonly error = signal('');

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
