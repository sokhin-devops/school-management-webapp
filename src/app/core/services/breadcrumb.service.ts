import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import { HOME_LABEL, HOME_ROUTE, breadcrumbTrail, isRouteUnder, routePath } from '../navigation/nav-items';
import { AcademicSettingsService } from './academic-settings.service';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly academic = inject(AcademicSettingsService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly path = computed(() => routePath(this.url()));

  // On the dashboard the trail is empty, so the home crumb carries the page name
  // itself — otherwise the bar reads as a lone icon with no text at all.
  readonly home = computed<MenuItem>(() => ({
    icon: 'pi pi-home',
    routerLink: HOME_ROUTE,
    label: isRouteUnder(this.path(), HOME_ROUTE) ? HOME_LABEL : undefined,
  }));

  /** In the school's own words, so the trail never disagrees with the menu above it. */
  readonly items = computed<MenuItem[] | undefined>(() => {
    this.academic.settings();
    const trail = breadcrumbTrail(this.url()).map((crumb) => ({ ...crumb, label: this.academic.rename(crumb.label) }));
    return trail.length ? trail : undefined;
  });
}
