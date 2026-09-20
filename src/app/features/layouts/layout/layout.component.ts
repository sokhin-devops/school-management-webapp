import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, KSidebarComponent, KTopbarComponent, KShareModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly breadcrumb = inject(BreadcrumbService);
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly router = inject(Router);

  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.activeData()),
    ),
    { initialValue: this.activeData() },
  );

  /**
   * Only the pages that actually have a card view offer the toggle — a control
   * that does nothing reads as broken. Pages opt in with `data: { layouts: true }`
   * on their route, so the answer lives next to the page rather than in a list
   * of paths here that would drift.
   */
  protected readonly showLayoutToggle = computed(() => this.routeData()['layouts'] === true);

  /**
   * Read off the router's own state snapshot rather than the injected
   * ActivatedRoute: this runs during construction, when the child route's
   * `snapshot` is not populated yet.
   */
  private activeData(): Data {
    let node: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (node?.firstChild) {
      node = node.firstChild;
    }
    return node?.data ?? {};
  }
}
