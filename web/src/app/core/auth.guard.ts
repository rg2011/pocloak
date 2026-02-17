import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const status = await authService.refreshStatus();
  if (status.isAuthenticated) {
    return true;
  }

  return router.parseUrl('/');
};
