import { Component, ElementRef, OnInit, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import type { Popover } from 'primeng/popover';
import { ScrollPanel } from 'primeng/scrollpanel';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { KShareModule } from '../../../share/k-share.module';

/** 05-sidebar-navigation.md: main navigation tree. */
const NAV_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
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

@Component({
  selector: 'app-k-sidebar',
  imports: [KShareModule],
  templateUrl: './k-sidebar.component.html',
  styleUrl: './k-sidebar.component.scss',
})
export class KSidebarComponent implements OnInit {
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;

  /**
   * The rail's open submenu popover. Tracked so selecting a child can close it —
   * the popover only dismisses itself on outside clicks, and a click on its own
   * menu item is an inside click.
   */
  private openRailPopover: Popover | null = null;

  private readonly navScroll = viewChild(ScrollPanel);
  private readonly navContent = viewChild<ElementRef<HTMLElement>>('navContent');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    // ScrollPanel only re-measures its bar on scroll, hover and *window* resize,
    // never when its own content changes height — which this nav does on every
    // group expand and on every switch between the rail and the full menu. Watch
    // the content so the bar keeps matching what is actually in the panel.
    effect((onCleanup) => {
      const panel = this.navScroll();
      const content = this.navContent()?.nativeElement;
      if (!panel || !content) return;

      const observer = new ResizeObserver(() => panel.moveBar());
      observer.observe(content);
      onCleanup(() => observer.disconnect());
    });
  }

  ngOnInit(): void {
    const onNavigate = () => {
      this.layoutUi.closeMobileDrawer();
      this.openRailPopover?.hide();
      this.openRailPopover = null;
    };

    for (const item of this.navItems) {
      if (item.items) {
        item.expanded = this.isItemActive(item);
        item.items.forEach((child) => (child.command = onNavigate));
      } else {
        item.command = onNavigate;
      }
    }
  }

  /**
   * Collapsed rail: a group opens its children in a popover, a leaf navigates
   * straight away since there is nothing to disclose.
   */
  protected onRailClick(item: MenuItem, event: Event, popover: Popover): void {
    if (item.items?.length) {
      this.openRailPopover = popover;
      popover.toggle(event);
      return;
    }

    this.openRailPopover?.hide();
    this.openRailPopover = null;

    if (typeof item.routerLink === 'string') {
      void this.router.navigateByUrl(item.routerLink);
    }
  }

  /** True when the item, or any of its children, is the current route. */
  protected isItemActive(item: MenuItem): boolean {
    const url = this.currentUrl();
    const links = item.items?.length
      ? item.items.map((child) => child.routerLink)
      : [item.routerLink];

    return links.some((link) => typeof link === 'string' && url.startsWith(link));
  }
}
