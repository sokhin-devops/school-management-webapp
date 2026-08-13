import { Injectable, signal } from '@angular/core';

/** Shared UI state between KTopbarComponent and KSidebarComponent (04-system-layout.md responsive behavior). */
@Injectable({ providedIn: 'root' })
export class LayoutUiService {
  private readonly _sidebarCollapsed = signal(false);
  private readonly _mobileDrawerOpen = signal(false);

  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly mobileDrawerOpen = this._mobileDrawerOpen.asReadonly();

  toggleSidebarCollapsed(): void {
    this._sidebarCollapsed.update((value) => !value);
  }

  expandSidebar(): void {
    this._sidebarCollapsed.set(false);
  }

  toggleMobileDrawer(): void {
    this._mobileDrawerOpen.update((value) => !value);
  }

  closeMobileDrawer(): void {
    this._mobileDrawerOpen.set(false);
  }
}
