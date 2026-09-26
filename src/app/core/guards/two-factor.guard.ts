import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { TwoFactorService } from '../services/two-factor.service';

/**
 * 67-security.md: a school that requires two-factor sends anyone without it to
 * set it up before anything else. The API refuses their other requests anyway;
 * this puts them on the page that explains why, rather than on a dashboard of
 * errors.
 */
export const twoFactorGuard: CanActivateFn = () => {
  const twoFactor = inject(TwoFactorService);
  const router = inject(Router);
  return twoFactor
    .ensureLoaded()
    .pipe(map(() => (twoFactor.setupRequired() ? router.createUrlTree(['/two-factor-setup']) : true)));
};
