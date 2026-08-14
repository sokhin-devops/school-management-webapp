import { Injectable, Signal, computed, signal } from '@angular/core';

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
  }
}

export type DataViewLayout = 'list' | 'grid';

@Injectable({ providedIn: 'root' })
export class LayoutUiService {
    private readonly storageKey = 'app-layout';

  readonly options: DataViewLayout[] = ['list', 'grid'];

  private readonly _layout = signal<DataViewLayout>(this.loadLayout());
  readonly layout: Signal<DataViewLayout> = this._layout.asReadonly();
  private readonly _mobileDrawerOpen = signal(false);
  private readonly _desktopCollapsed = signal(readCollapsed());
  private readonly _isMobile = signal(false);

  readonly mobileDrawerOpen = this._mobileDrawerOpen.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();

  readonly sidebarCollapsed = computed(() => !this._isMobile() && this._desktopCollapsed());

  constructor() {
    const query = window.matchMedia(MOBILE_QUERY);
    this._isMobile.set(query.matches);

    query.addEventListener('change', (event) => {
      this._isMobile.set(event.matches);
      if (!event.matches) {
        this._mobileDrawerOpen.set(false);
      }
    });
  }
  
  // SIDEBAR COLLAPSE
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


  // DATA VIEW LAYOUT
  setLayout(layout: DataViewLayout): void {
    this._layout.set(layout);
    this.saveLayout(layout);
  }

  toggleLayout(): void {
    this.setLayout(this._layout() === 'grid' ? 'list' : 'grid');
  }


  private loadLayout(): DataViewLayout {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'list' || saved === 'grid') {
        return saved;
      }
    } catch {
    }
    return 'grid';
  }

  private saveLayout(layout: DataViewLayout): void {
    try {
      localStorage.setItem(this.storageKey, layout);
    } catch {
    }
  }
}
