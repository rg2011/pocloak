import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { HttpExchange } from '../core/api.types';

@Component({
  selector: 'app-endpoint-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="box" *ngIf="exchange">
      <h3 class="title is-6">{{ title }}</h3>
      <div class="content">
        <p><strong>Request:</strong> {{ exchange.request.method }} {{ exchange.request.url }}</p>
        <pre>{{ toPretty(exchange.request) }}</pre>
        <p><strong>Response:</strong> HTTP {{ exchange.reply.http_code }}</p>
        <pre>{{ toPretty(exchange.reply) }}</pre>
      </div>
    </article>
  `
})
export class EndpointInspectorComponent {
  @Input({ required: true }) title = '';
  @Input() exchange: HttpExchange | null = null;

  toPretty(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
