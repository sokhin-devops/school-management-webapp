import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, KSidebarComponent, KTopbarComponent, KShareModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  protected readonly breadcrumb = inject(BreadcrumbService);
}
