import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { KShareModule } from '../../../share/k-share.module';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../environment/environment';
import { TwoFactorDialogComponent } from '../../account/two-factor-dialog/two-factor-dialog.component';

@Component({
  selector: 'app-k-topbar',
  imports: [KShareModule, OverlayBadgeModule, RouterLink, TwoFactorDialogComponent],
  templateUrl: './k-topbar.component.html',
  styleUrl: './k-topbar.component.scss',
})
export class KTopbarComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  protected readonly branchContext = inject(BranchContextService);
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  protected readonly notifications = inject(NotificationService);

  /** 67-security.md: the signed-in person's own two-factor sign-in, from the account menu. */
  protected readonly twoFactorVisible = signal(false);

  protected readonly branches = this.branchContext.branches;
  protected readonly selectedBranchId = computed(() => this.branchContext.selectedBranch()?.id ?? null);

  /** The signed-in account — the one the session belongs to, not the sign-up draft. */
  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? '');
  protected readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');
  protected readonly userInitials = computed(() =>
    this.userName()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );

  /** The order a new school sets itself up in - each step opens the page it names. */
  protected readonly gettingStarted = [
    { label: 'Check your school profile', route: '/settings/school' },
    { label: 'Add your branches', route: '/settings/branches' },
    { label: 'Choose the academic concepts you use', route: '/settings/academic' },
    { label: 'Set up academic years and classes', route: '/academic/classes' },
    { label: 'Add teachers and students', route: '/people/students' },
    { label: 'Invite your staff', route: '/settings/users-roles' },
  ];

  /** The API's own live documentation, served beside it. */
  protected readonly apiReference = `${environment.apiUrl}swagger-ui.html`;

  protected open(notification: AppNotification): void {
    this.notifications.markRead(notification);
    if (notification.link) {
      void this.router.navigateByUrl(notification.link);
    }
  }

  /** "Just now", "12 min ago", "3 h ago", "Yesterday", then the date. */
  protected timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    const minutes = Math.round((Date.now() - then) / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    if (hours < 48) return 'Yesterday';
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  onBranchChange(branchId: string): void {
    this.branchContext.selectBranch(branchId);
  }

  /**
   * Revokes the session on the server, then clears it here. Only navigating
   * away left both tokens in storage, and the guard let the next visit
   * straight back in.
   */
  logout(): void {
    this.auth.logout();
  }
}
