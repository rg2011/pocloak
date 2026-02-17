import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { HomePageComponent } from './features/home/home.page';
import { ConfigPageComponent } from './features/config/config.page';
import { DiscoveryPageComponent } from './features/discovery/discovery.page';
import { OidcPageComponent } from './features/oidc/oidc.page';
import { SessionPageComponent } from './features/session/session.page';
import { TokensPageComponent } from './features/tokens/tokens.page';

export const appRoutes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'config', component: ConfigPageComponent },
  { path: 'discovery', component: DiscoveryPageComponent },
  { path: 'tokens', component: TokensPageComponent, canActivate: [authGuard] },
  { path: 'session', component: SessionPageComponent, canActivate: [authGuard] },
  { path: 'oidc', component: OidcPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
