import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, catchError, filter, map, of, shareReplay, tap } from 'rxjs';
import { PermissionAction } from '../models';
import { ApiPermissionAction } from '../api/api.models';
import { ApiClientService } from './api-client.service';

/** The eight modules a role's grid is drawn from — 64-users-and-roles.md. */
export type PermissionModule =
  | 'students'
  | 'teachers'
  | 'parents'
  | 'academic'
  | 'attendance'
  | 'finance'
  | 'reports'
  | 'settings';

interface ApiMyPermissions {
  roleId: string | null;
  roleName: string | null;
  unrestricted: boolean;
  owner: boolean;
  permissions: { module: string; actions: ApiPermissionAction[] }[];
  /** The plan's enabled features; null when there is no live plan and nothing is gated. */
  features: string[] | null;
}

/** Which plan feature each page needs - the codes the plans are seeded with. */
const FEATURE_BY_ROUTE: Readonly<Record<string, string>> = {
  'people/students': 'STUDENT_MANAGEMENT',
  'people/teachers': 'TEACHER_MANAGEMENT',
  'people/parents': 'PARENT_MANAGEMENT',
  attendance: 'ATTENDANCE',
  finance: 'FINANCE',
  reports: 'REPORTS',
  exams: 'EXAMS',
};

/** What each feature is called when a page has to say it is not in the plan. */
export const FEATURE_NAMES: Readonly<Record<string, string>> = {
  STUDENT_MANAGEMENT: 'Student management',
  TEACHER_MANAGEMENT: 'Teacher management',
  PARENT_MANAGEMENT: 'Parent management',
  ATTENDANCE: 'Attendance',
  FINANCE: 'Finance',
  REPORTS: 'Reports',
  EXAMS: 'Exams',
  GRADES: 'Grades',
  CUSTOM_ROLES: 'Custom roles',
  MULTIPLE_BRANCHES: 'Multiple branches',
  NOTIFICATIONS: 'Notifications',
};

/**
 * The first path segment of a route decides its module, except under People,
 * where each of the three lists is its own module.
 */
const MODULE_BY_ROUTE: Readonly<Record<string, PermissionModule>> = {
  academic: 'academic',
  'people/students': 'students',
  'people/teachers': 'teachers',
  'people/parents': 'parents',
  attendance: 'attendance',
  exams: 'academic',
  finance: 'finance',
  reports: 'reports',
  settings: 'settings',
};

/**
 * What the signed-in user may do.
 *
 * The server refuses whatever the grid withholds; this is the same grid read
 * back so the screens can leave out a button rather than offer one that fails.
 * It is a convenience, never the guard — removing a button removes a mistake,
 * not an attack.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  private readonly grid = signal<ReadonlyMap<string, ReadonlySet<PermissionAction>>>(new Map());
  private readonly _unrestricted = signal(true);
  private readonly _loaded = signal(false);
  private readonly _roleName = signal<string | null>(null);
  private readonly _owner = signal(false);
  private readonly _features = signal<ReadonlySet<string> | null>(null);

  /** In flight or finished. Shared, so the guards on one navigation ask once. */
  private request: Observable<boolean> | null = null;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * The module of the page on screen. Row actions, the Add buttons and the
   * detail drawer all ask about "here", so here is worked out once.
   */
  readonly currentModule = computed(() => this.moduleForUrl(this.currentUrl()));

  /** True for an owner, and for a member who holds no role. */
  readonly unrestricted = this._unrestricted.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly roleName = this._roleName.asReadonly();
  /** The tenant's owner: the one person deleting all data is kept for. */
  readonly owner = this._owner.asReadonly();

  /**
   * Whether the school's plan includes a feature. Everything counts as
   * included until the plan is known, and when there is no live plan at all:
   * the server gates by plan, and neither of those is a reason to hide a page.
   */
  planIncludes(feature: string | null): boolean {
    const features = this._features();
    return !feature || features === null || features.has(feature);
  }

  /** The plan feature a page needs, or null for pages every plan has. */
  featureForUrl(url: string): string | null {
    const path = url.split('?')[0].split('#')[0].replace(/^\/+/, '');
    const [first, second] = path.split('/');
    return FEATURE_BY_ROUTE[`${first}/${second}`] ?? FEATURE_BY_ROUTE[first] ?? null;
  }

  /**
   * Nothing is hidden until the grid has arrived. The route guard waits for it,
   * so by the time a page renders this is settled; it matters only for the
   * moment before, and for a grid that could not be read at all.
   */
  private readonly permissive = computed(() => !this._loaded() || this._unrestricted());

  /**
   * Resolves once the grid is known. Callers get the same request rather than
   * one each, and a failure resolves too — a grid that cannot be read leaves
   * the screens as they were, and the server still refuses what it refuses.
   */
  ensureLoaded(): Observable<boolean> {
    this.request ??= this.api.get<ApiMyPermissions>('api/v1/auth/me/permissions').pipe(
      tap((permissions) => this.accept(permissions)),
      map(() => true),
      catchError(() => of(true)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.request;
  }

  /** Cleared on sign-out so the next user does not inherit this one's grid. */
  clear(): void {
    this.request = null;
    this.grid.set(new Map());
    this._unrestricted.set(true);
    this._roleName.set(null);
    this._owner.set(false);
    this._features.set(null);
    this._loaded.set(false);
  }

  can(module: PermissionModule | null, action: PermissionAction): boolean {
    if (!module || this.permissive()) {
      return true;
    }
    return this.grid().get(module)?.has(action) ?? false;
  }

  canView(module: PermissionModule | null): boolean {
    return this.can(module, PermissionAction.View);
  }

  canCreate(module: PermissionModule | null): boolean {
    return this.can(module, PermissionAction.Create);
  }

  canEdit(module: PermissionModule | null): boolean {
    return this.can(module, PermissionAction.Edit);
  }

  canDelete(module: PermissionModule | null): boolean {
    return this.can(module, PermissionAction.Delete);
  }

  /**
   * The module a URL belongs to, or null where the grid has nothing to say —
   * the dashboard and the onboarding screens, which everyone signed in reaches.
   */
  moduleForUrl(url: string): PermissionModule | null {
    const path = url.split('?')[0].split('#')[0].replace(/^\/+/, '');
    const [first, second] = path.split('/');
    return MODULE_BY_ROUTE[`${first}/${second}`] ?? MODULE_BY_ROUTE[first] ?? null;
  }

  private accept(permissions: ApiMyPermissions | null): void {
    const grid = new Map<string, ReadonlySet<PermissionAction>>();
    for (const entry of permissions?.permissions ?? []) {
      grid.set(
        entry.module,
        new Set((entry.actions ?? []).map((action) => action.toLowerCase() as PermissionAction)),
      );
    }

    this.grid.set(grid);
    this._unrestricted.set(permissions?.unrestricted ?? true);
    this._roleName.set(permissions?.roleName ?? null);
    this._owner.set(permissions?.owner ?? false);
    this._features.set(permissions?.features ? new Set(permissions.features) : null);
    this._loaded.set(true);
  }
}
