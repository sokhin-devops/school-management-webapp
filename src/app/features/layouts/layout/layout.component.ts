import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KSidebarComponent } from '../k-sidebar/k-sidebar.component';
import { KTopbarComponent } from '../k-topbar/k-topbar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, KSidebarComponent, KTopbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
