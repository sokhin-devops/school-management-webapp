import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { HOME_ROUTE, isRouteUnder } from '../../../core/navigation/nav-items';
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

  // The dashboard has no list/grid view of its own, so the toggle is hidden there.
  protected readonly showLayoutToggle = computed(() => !isRouteUnder(this.breadcrumb.path(), HOME_ROUTE));
}
