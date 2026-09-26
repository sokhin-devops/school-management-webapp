import { Component, ElementRef, OnInit, computed, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import type { Popover } from 'primeng/popover';
import { ScrollPanel } from 'primeng/scrollpanel';
import { NAV_ITEMS, isRouteUnder } from '../../../core/navigation/nav-items';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AcademicSettingsService } from '../../../core/services/academic-settings.service';
import { SchoolService } from '../../../core/services/school.service';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-k-sidebar',
  imports: [KShareModule],
  templateUrl: './k-sidebar.component.html',
  styleUrl: './k-sidebar.component.scss',
})
export class KSidebarComponent implements OnInit {
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly academic = inject(AcademicSettingsService);
  private readonly school = inject(SchoolService);

  protected readonly schoolName = computed(() => this.school.school()?.name ?? '');
  protected readonly brandName = computed(() => {
    const school = this.school.school();
    return school?.shortName || school?.name || 'School';
  });

  /**
   * The menu, less what this role cannot view and what the school has switched
   * off, in the school's own words. A group whose children are all withheld
   * goes too, rather than staying as a heading that opens onto nothing.
   *
   * Computed, so the same array is handed to the template until something it
   * reads actually changes - a fresh one per check would restart the menu on
   * every pass.
   */
  protected readonly navItems = computed(() => {
    const permissive = this.permissions.unrestricted() || !this.permissions.loaded();

    const visible = (link: unknown) =>
      typeof link !== 'string' ||
      ((permissive || this.permissions.canView(this.permissions.moduleForUrl(link))) &&
        this.permissions.planIncludes(this.permissions.featureForUrl(link)) &&
        this.academic.isRouteEnabled(link));

    // rename() and isRouteEnabled() read the settings, so the menu follows them.
    const relabel = (item: MenuItem): MenuItem => {
      const label = this.academic.rename(item.label);
      return label === item.label ? item : { ...item, label };
    };

    const items: MenuItem[] = [];
    for (const item of NAV_ITEMS) {
      if (!item.items) {
        if (visible(item.routerLink)) items.push(relabel(item));
        continue;
      }

      const children = item.items.filter((child) => visible(child.routerLink)).map(relabel);
      if (!children.length) continue;
      const unchanged = children.length === item.items.length && children.every((child, i) => child === item.items![i]);
      items.push(unchanged ? item : { ...item, items: children });
    }

    return items;
  });

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

    // Bound to the shared items rather than to the filtered view: filtering
    // reuses these same objects, so wiring them once covers both.
    for (const item of NAV_ITEMS) {
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

    return links.some((link) => isRouteUnder(url, link));
  }
}
