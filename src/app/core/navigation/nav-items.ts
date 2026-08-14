import type { MenuItem } from 'primeng/api';

/** The route the home crumb points at, and the one page with no trail of its own. */
export const HOME_ROUTE = '/dashboard';

/**
 * 05-sidebar-navigation.md: main navigation tree.
 *
 * Shared rather than owned by the sidebar because the breadcrumb reads the same
 * shape — 62-branches.md asks for `Settings / Branches`, which is this tree's
 * group-then-leaf path. Keeping one source means a renamed menu entry can never
 * disagree with the crumb above the page.
 */
export const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', routerLink: HOME_ROUTE },
  {
    label: 'Academic',
    icon: 'pi pi-book',
    items: [
      { label: 'Programs', icon: 'pi pi-sitemap', routerLink: '/academic/programs' },
      { label: 'Levels', icon: 'pi pi-list', routerLink: '/academic/levels' },
      { label: 'Classes', icon: 'pi pi-th-large', routerLink: '/academic/classes' },
      { label: 'Subjects', icon: 'pi pi-book', routerLink: '/academic/subjects' },
      { label: 'Academic Years', icon: 'pi pi-calendar', routerLink: '/academic/academic-years' },
      { label: 'Rooms', icon: 'pi pi-building', routerLink: '/academic/rooms' },
    ],
  },
  {
    label: 'People',
    icon: 'pi pi-users',
    items: [
      { label: 'Students', icon: 'pi pi-graduation-cap', routerLink: '/people/students' },
      { label: 'Teachers', icon: 'pi pi-id-card', routerLink: '/people/teachers' },
      { label: 'Parents', icon: 'pi pi-users', routerLink: '/people/parents' },
    ],
  },
  { label: 'Attendance', icon: 'pi pi-calendar-clock', routerLink: '/attendance' },
  { label: 'Exams / Assessments', icon: 'pi pi-clipboard', routerLink: '/exams' },
  {
    label: 'Finance',
    icon: 'pi pi-wallet',
    items: [
      { label: 'Fees', icon: 'pi pi-money-bill', routerLink: '/finance/fees' },
      { label: 'Payments', icon: 'pi pi-credit-card', routerLink: '/finance/payments' },
      { label: 'Expenses', icon: 'pi pi-receipt', routerLink: '/finance/expenses' },
      { label: 'Financial Reports', icon: 'pi pi-chart-line', routerLink: '/finance/reports' },
    ],
  },
  {
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    items: [
      { label: 'Student Reports', icon: 'pi pi-file', routerLink: '/reports/students' },
      { label: 'Attendance Reports', icon: 'pi pi-calendar', routerLink: '/reports/attendance' },
      { label: 'Academic Reports', icon: 'pi pi-book', routerLink: '/reports/academic' },
      { label: 'Financial Reports', icon: 'pi pi-chart-line', routerLink: '/reports/financial' },
    ],
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    items: [
      { label: 'School', icon: 'pi pi-building', routerLink: '/settings/school' },
      { label: 'Branches', icon: 'pi pi-map-marker', routerLink: '/settings/branches' },
      { label: 'Academic', icon: 'pi pi-book', routerLink: '/settings/academic' },
      { label: 'Users & Roles', icon: 'pi pi-users', routerLink: '/settings/users-roles' },
      { label: 'Notifications', icon: 'pi pi-bell', routerLink: '/settings/notifications' },
      { label: 'Appearance', icon: 'pi pi-palette', routerLink: '/settings/appearance' },
      { label: 'Security', icon: 'pi pi-shield', routerLink: '/settings/security' },
      { label: 'Subscription', icon: 'pi pi-star', routerLink: '/settings/subscription' },
      { label: 'System', icon: 'pi pi-server', routerLink: '/settings/system' },
    ],
  },
];

/** Label of the home entry, read from the tree so a rename carries to the crumb. */
export const HOME_LABEL = NAV_ITEMS.find((item) => item.routerLink === HOME_ROUTE)?.label;

/** The path part of a URL, without query string or fragment. */
export function routePath(url: string): string {
  return url.split(/[?#]/)[0];
}

/** True when `url` is the item's page or something nested below it. */
export function isRouteUnder(url: string, link: MenuItem['routerLink']): boolean {
  return typeof link === 'string' && (url === link || url.startsWith(`${link}/`));
}

/**
 * The crumb trail for a URL, as group-then-leaf. Empty for the home route, which
 * the home crumb already stands for, and for anything outside the nav tree.
 */
export function breadcrumbTrail(url: string): MenuItem[] {
  const path = routePath(url);

  for (const item of NAV_ITEMS) {
    if (item.items?.length) {
      const child = item.items.find((entry) => isRouteUnder(path, entry.routerLink));
      // The group heads the trail but has no page of its own, so neither crumb
      // navigates — the last one is the page you are already on.
      if (child) return [{ label: item.label, disabled: true }, { label: child.label, disabled: true }];
    } 
    else if (isRouteUnder(path, item.routerLink)) {
      return item.routerLink === HOME_ROUTE ? [] : [{ label: item.label, disabled: true }];
    }
  }

  return [];
}
