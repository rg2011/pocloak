import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="box">
      <h2 class="title is-5">Runtime Config</h2>
      <p class="mb-3">Edita la configuración OIDC y fuerza reinicio controlado del proceso.</p>

      <div class="field">
        <label class="label">Config JSON</label>
        <div class="control">
          <textarea class="textarea" rows="18" [(ngModel)]="configJson"></textarea>
        </div>
      </div>

      <div class="buttons">
        <button class="button is-link" (click)="saveConfig()" [disabled]="loading()">Save</button>
        <button class="button is-danger" (click)="restart()" [disabled]="loading()">Restart Process</button>
      </div>

      <p *ngIf="message()">{{ message() }}</p>
      <p *ngIf="error()">{{ error() }}</p>
    </article>
  `
})
export class ConfigPageComponent {
  private readonly http = inject(HttpClient);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  configJson = '{}';

  constructor() {
    void this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');
      const response = await firstValueFrom(this.http.get<{ rawConfig: unknown }>('/api/config'));
      this.configJson = JSON.stringify(response.rawConfig || {}, null, 2);
    } catch (error) {
      this.error.set('No se pudo cargar configuración.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveConfig(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');
      this.message.set('');
      const payload = JSON.parse(this.configJson);
      await firstValueFrom(this.http.post('/api/config', payload));
      this.message.set('Configuración guardada.');
    } catch (error) {
      this.error.set('JSON inválido o error al guardar configuración.');
    } finally {
      this.loading.set(false);
    }
  }

  async restart(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');
      this.message.set('Reiniciando proceso, esperando healthcheck...');
      await firstValueFrom(this.http.post('/api/config/restart', {}));

      const startedAt = Date.now();
      while (Date.now() - startedAt < 15000) {
        try {
          await firstValueFrom(this.http.get('/api/health'));
          window.location.href = '/';
          return;
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }

      this.error.set('No hubo respuesta del servidor tras reinicio.');
    } catch (error) {
      this.error.set('No se pudo solicitar el reinicio.');
    } finally {
      this.loading.set(false);
    }
  }
}
