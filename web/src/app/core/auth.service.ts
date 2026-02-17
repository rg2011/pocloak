import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStatus } from './api.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly authState = signal<AuthStatus>({ isAuthenticated: false, tokens: null });

  constructor(private readonly http: HttpClient) {}

  async refreshStatus(): Promise<AuthStatus> {
    const status = await firstValueFrom(this.http.get<AuthStatus>('/api/auth/status'));
    this.authState.set(status);
    return status;
  }

  login(): void {
    window.location.href = '/login';
  }

  logout(): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    document.body.appendChild(form);
    form.submit();
  }
}
