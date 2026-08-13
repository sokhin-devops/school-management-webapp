import { Injectable, computed, signal } from '@angular/core';

/** Matches the `max-width` breakpoint the layout stylesheets use for mobile. */
const MOBILE_QUERY = '(max-width: 767.98px)';
const COLLAPSED_KEY = 'k-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  } catch {
    // Private browsing / storage disabled — collapse still works for this session.
  }
}

/** Shared UI state between KTopbarComponent and KSidebarComponent (04-system-layout.md responsive behavior). */
@Injectable({ providedIn: 'root' })
export class LayoutUiService {
  private readonly _mobileDrawerOpen = signal(false);
  private readonly _desktopCollapsed = signal(readCollapsed());
  private readonly _isMobile = signal(false);

  readonly mobileDrawerOpen = this._mobileDrawerOpen.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();

  /**
   * Icon-only rail (05-sidebar-navigation.md). Never true on mobile, where the
   * sidebar is a full-width drawer instead.
   */
  readonly sidebarCollapsed = computed(() => !this._isMobile() && this._desktopCollapsed());

  constructor() {
    const query = window.matchMedia(MOBILE_QUERY);
    this._isMobile.set(query.matches);

    query.addEventListener('change', (event) => {
      this._isMobile.set(event.matches);
      // Leaving mobile mid-drawer would otherwise leave the backdrop stuck on.
      if (!event.matches) {
        this._mobileDrawerOpen.set(false);
      }
    });
  }

  /** The single topbar button: opens the drawer on mobile, collapses the rail otherwise. */
  toggleSidebar(): void {
    if (this._isMobile()) {
      this.toggleMobileDrawer();
      return;
    }

    const collapsed = !this._desktopCollapsed();
    this._desktopCollapsed.set(collapsed);
    writeCollapsed(collapsed);
  }

  toggleMobileDrawer(): void {
    this._mobileDrawerOpen.update((value) => !value);
  }

  closeMobileDrawer(): void {
    this._mobileDrawerOpen.set(false);
  }
}
