import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutUiService } from '../../../core/services/layout-ui.service';

interface NavChild {
  label: string;
  icon: string;
  route: string;
}

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavChild[];
}

/** 05-sidebar-navigation.md: main navigation tree. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
  {
    label: 'Academic',
    icon: 'pi pi-book',
    children: [
      { label: 'Programs', icon: 'pi pi-sitemap', route: '/academic/programs' },
      { label: 'Levels', icon: 'pi pi-list', route: '/academic/levels' },
      { label: 'Classes', icon: 'pi pi-th-large', route: '/academic/classes' },
      { label: 'Subjects', icon: 'pi pi-book', route: '/academic/subjects' },
      { label: 'Academic Years', icon: 'pi pi-calendar', route: '/academic/academic-years' },
      { label: 'Rooms', icon: 'pi pi-building', route: '/academic/rooms' },
    ],
  },
  {
    label: 'People',
    icon: 'pi pi-users',
    children: [
      { label: 'Students', icon: 'pi pi-graduation-cap', route: '/people/students' },
      { label: 'Teachers', icon: 'pi pi-id-card', route: '/people/teachers' },
      { label: 'Parents', icon: 'pi pi-users', route: '/people/parents' },
    ],
  },
  { label: 'Attendance', icon: 'pi pi-calendar-clock', route: '/attendance' },
  { label: 'Exams / Assessments', icon: 'pi pi-clipboard', route: '/exams' },
  {
    label: 'Finance',
    icon: 'pi pi-wallet',
    children: [
      { label: 'Fees', icon: 'pi pi-money-bill', route: '/finance/fees' },
      { label: 'Payments', icon: 'pi pi-credit-card', route: '/finance/payments' },
      { label: 'Expenses', icon: 'pi pi-receipt', route: '/finance/expenses' },
      { label: 'Financial Reports', icon: 'pi pi-chart-line', route: '/finance/reports' },
    ],
  },
  {
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    children: [
      { label: 'Student Reports', icon: 'pi pi-file', route: '/reports/students' },
      { label: 'Attendance Reports', icon: 'pi pi-calendar', route: '/reports/attendance' },
      { label: 'Academic Reports', icon: 'pi pi-book', route: '/reports/academic' },
      { label: 'Financial Reports', icon: 'pi pi-chart-line', route: '/reports/financial' },
    ],
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    children: [
      { label: 'School', icon: 'pi pi-building', route: '/settings/school' },
      { label: 'Branches', icon: 'pi pi-map-marker', route: '/settings/branches' },
      { label: 'Academic', icon: 'pi pi-book', route: '/settings/academic' },
      { label: 'Users & Roles', icon: 'pi pi-users', route: '/settings/users-roles' },
      { label: 'Notifications', icon: 'pi pi-bell', route: '/settings/notifications' },
      { label: 'Appearance', icon: 'pi pi-palette', route: '/settings/appearance' },
      { label: 'Security', icon: 'pi pi-shield', route: '/settings/security' },
      { label: 'Subscription', icon: 'pi pi-star', route: '/settings/subscription' },
      { label: 'System', icon: 'pi pi-server', route: '/settings/system' },
    ],
  },
];

@Component({
  selector: 'app-k-sidebar',
  imports: [RouterLink, RouterLinkActive, TooltipModule],
  templateUrl: './k-sidebar.component.html',
  styleUrl: './k-sidebar.component.scss',
})
export class KSidebarComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  protected readonly navItems = NAV_ITEMS;

  private readonly openGroups = new Set<string>();

  isGroupOpen(label: string): boolean {
    return this.openGroups.has(label);
  }

  toggleGroup(label: string): void {
    if (this.layoutUi.sidebarCollapsed()) {
      this.layoutUi.expandSidebar();
      this.openGroups.add(label);
      return;
    }
    if (this.openGroups.has(label)) {
      this.openGroups.delete(label);
    } else {
      this.openGroups.add(label);
    }
  }

  onLeafClick(): void {
    this.layoutUi.closeMobileDrawer();
  }
}
