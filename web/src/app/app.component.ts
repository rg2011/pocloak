import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar is-light" role="navigation" aria-label="main navigation">
      <div class="container">
        <div class="navbar-menu is-active">
          <div class="navbar-start">
            <a class="navbar-item" routerLink="/" routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold" [routerLinkActiveOptions]="{ exact: true }">Home</a>
            <a class="navbar-item" routerLink="/flows" routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold">Flows</a>
            <a class="navbar-item" routerLink="/discovery" routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold">Discovery</a>
            <a
              *ngIf="isAuthenticated(); else tokensDisabled"
              class="navbar-item"
              routerLink="/tokens"
              routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold"
            >
              Token
            </a>
            <ng-template #tokensDisabled><span class="navbar-item has-text-grey-light">Token</span></ng-template>
            <a
              *ngIf="isAuthenticated(); else sessionDisabled"
              class="navbar-item"
              routerLink="/session"
              routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold"
            >
              Session
            </a>
            <ng-template #sessionDisabled><span class="navbar-item has-text-grey-light">Session</span></ng-template>
            <a
              *ngIf="isAuthenticated(); else oidcDisabled"
              class="navbar-item"
              routerLink="/oidc"
              routerLinkActive="is-active has-background-link-light has-text-link-dark has-text-weight-semibold"
            >
              OIDC
            </a>
            <ng-template #oidcDisabled><span class="navbar-item has-text-grey-light">OIDC</span></ng-template>
          </div>

          <div class="navbar-end">
            <div class="navbar-item">
              <div class="buttons">
                <button class="button is-primary" (click)="authService.login()" *ngIf="!isAuthenticated()">Login</button>
                <button class="button is-light" (click)="authService.logout()" *ngIf="isAuthenticated()">Logout</button>
                <span class="tag" [class.is-success]="isAuthenticated()" [class.is-warning]="!isAuthenticated()">
                  {{ isAuthenticated() ? 'Authenticated' : 'Anonymous' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <section class="section">
      <div class="container">
        <router-outlet></router-outlet>
      </div>
    </section>
  `
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly isAuthenticated = computed(() => this.authService.authState().isAuthenticated);

  constructor() {
    void this.authService.refreshStatus();
  }
}
