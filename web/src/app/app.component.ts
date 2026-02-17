import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
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
                <button class="button is-primary" (click)="openLoginModal()" *ngIf="!isAuthenticated()">Login</button>
                <button
                  class="button is-primary"
                  (click)="authService.clientLogin()"
                  *ngIf="!isAuthenticated() && supportsClientLogin()"
                >
                  Client Login
                </button>
                <button class="button is-danger is-outlined" (click)="authService.logout()" *ngIf="isAuthenticated()">Logout</button>
                <span class="tag" [class.is-success]="isAuthenticated()" [class.is-warning]="!isAuthenticated()">
                  {{ isAuthenticated() ? authLabel() : 'Anonymous' }}
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

    <div class="modal" [class.is-active]="isLoginModalOpen()">
      <div class="modal-background" (click)="closeLoginModal()"></div>
      <div class="modal-content">
        <form class="box" (ngSubmit)="submitLogin()">
          <h3 class="title is-4 mb-5">Welcome to POCloak!</h3>
          <div class="field mb-5">
            <label class="label" for="service-name-input">Service Name</label>
            <div class="control">
              <input
                id="service-name-input"
                class="input"
                type="text"
                name="serviceName"
                maxlength="64"
                [(ngModel)]="serviceNameInput"
                placeholder="Type a short text"
              />
            </div>
          </div>
          <div class="is-flex is-justify-content-flex-end">
            <div class="buttons mb-0">
              <button class="button is-light" type="button" (click)="closeLoginModal()">Close</button>
              <button class="button is-primary" type="submit">Submit</button>
            </div>
          </div>
        </form>
      </div>
      <button class="modal-close is-large" aria-label="close" (click)="closeLoginModal()"></button>
    </div>
  `
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly isAuthenticated = computed(() => this.authService.authState().isAuthenticated);
  readonly supportsClientLogin = computed(() => this.authService.authState().hasClientSecret);
  readonly authLabel = computed(() => {
    const authState = this.authService.authState();
    if (authState.validatedIdp) {
      return `${authState.validatedIdp} (verified)`;
    }
    if (authState.kcIdpHint) {
      return `${authState.kcIdpHint} (unverified)`;
    }
    return 'unknown idp';
  });
  readonly isLoginModalOpen = signal(false);
  serviceNameInput = '';

  constructor() {
    void this.authService.refreshStatus();
  }

  openLoginModal(): void {
    this.serviceNameInput = '';
    this.isLoginModalOpen.set(true);
  }

  closeLoginModal(): void {
    this.isLoginModalOpen.set(false);
  }

  submitLogin(): void {
    this.isLoginModalOpen.set(false);
    this.authService.login(this.serviceNameInput);
  }
}
