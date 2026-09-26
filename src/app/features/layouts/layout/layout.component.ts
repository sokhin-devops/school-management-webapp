import { Component, DestroyRef, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { KShareModule } from '../../../share/k-share.module';
import { ConfirmDeleteDialogComponent, FormErrorDialogComponent } from '../../../share/components';
import { KQuickAddComponent } from '../k-quick-add/k-quick-add.component';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SchoolService } from '../../../core/services/school.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, KSidebarComponent, KTopbarComponent, KShareModule, FormErrorDialogComponent, ConfirmDeleteDialogComponent, KQuickAddComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly breadcrumb = inject(BreadcrumbService);
  private readonly branchContext = inject(BranchContextService);
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly router = inject(Router);

  constructor() {
    // Every branch-scoped request needs a branch id, so the shell fetches the
    // branches before the first page under it asks for anything.
    this.branchContext.ensureLoaded();
    // Its currency is how every amount on every page is shown.
    inject(SchoolService).ensureLoaded();

    // The bell polls for as long as the shell is on screen - which is exactly
    // as long as someone is signed in.
    inject(NotificationService).start(inject(DestroyRef));
  }

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
