import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../_services/_core/auth.service';
import { RouterPaths } from '../_helpers/router-paths';

export const authGuard = (type: 'FOR_LOGGED' | 'FOR_NOT_LOGGED') => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (type === 'FOR_LOGGED') {
      return authService.isLoggedIn() || router.navigate([RouterPaths.AUTH]);
    } else {
      return !authService.isLoggedIn() || router.navigate([RouterPaths.MAIN]);
    }
  };
};
