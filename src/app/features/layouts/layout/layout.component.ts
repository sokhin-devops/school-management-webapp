import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';
import { MenuItem } from 'primeng/api';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, KSidebarComponent, KTopbarComponent, KShareModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  items: MenuItem[] | undefined;

  home: MenuItem | undefined;

  ngOnInit() {
    this.items = [{ icon: 'pi pi-home', route: '/installation' }, { label: 'Components' }, { label: 'Form' }, { label: 'InputText', route: '/inputtext' }];
  }
}
