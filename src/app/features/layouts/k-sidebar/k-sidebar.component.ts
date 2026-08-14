import { Component, ElementRef, OnInit, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import type { MenuItem } from 'primeng/api';
import type { Popover } from 'primeng/popover';
import { ScrollPanel } from 'primeng/scrollpanel';
import { NAV_ITEMS, isRouteUnder } from '../../../core/navigation/nav-items';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
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

    return links.some((link) => isRouteUnder(url, link));
  }
}
