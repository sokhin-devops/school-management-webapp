import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { AcademicSettingsService } from '../services/academic-settings.service';
import { PermissionService } from '../services/permission.service';

/**
 * Keeps a user out of a module their role cannot view, and out of an academic
 * page their school has switched off - whether they reached it from the
 * sidebar or by typing the URL.
 *
 * It waits for both rather than letting the first navigation through: on a
 * full page load the guard runs before either request could have returned,
 * and a guard that passes whenever it is asked early is no guard at all. The
 * wait costs two requests, once per session.
 */
export const permissionGuard: CanActivateFn = (_route, state) => {
  const permissions = inject(PermissionService);
  const academic = inject(AcademicSettingsService);
  const router = inject(Router);

  return forkJoin([permissions.ensureLoaded(), academic.ensureLoaded()]).pipe(
    map(() => {
      // Not in the plan: shown where it can be got, with which plans have it.
      const feature = permissions.featureForUrl(state.url);
      if (!permissions.planIncludes(feature)) {
        return router.createUrlTree(['/settings/subscription'], { queryParams: { feature } });
      }
      return permissions.canView(permissions.moduleForUrl(state.url)) && academic.isRouteEnabled(state.url)
        ? true
        // The dashboard is outside the grid and every school has it, so it is
        // somewhere to land that will not bounce them again.
        : router.createUrlTree(['/dashboard']);
    }),
  );
};
