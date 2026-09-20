import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { KShareModule } from '../../../share/k-share.module';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { Branch, Status } from '../../../core/models';
import { OnboardingService } from '../../../core/services/onboarding.service';

interface TopbarNotification {
  id: string;
  icon: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-k-topbar',
  imports: [KShareModule, OverlayBadgeModule, RouterLink],
  templateUrl: './k-topbar.component.html',
  styleUrl: './k-topbar.component.scss',
})
export class KTopbarComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  protected readonly branchContext = inject(BranchContextService);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  protected readonly branches = this.branchContext.branches;
  protected readonly selectedBranchId = computed(() => this.branchContext.selectedBranch().id);

  protected readonly userName = this.onboarding.account?.name ?? 'Account Owner';
  protected readonly userEmail = this.onboarding.account?.email ?? 'owner@example.com';
  protected readonly userInitials = this.userName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  protected readonly notifications: TopbarNotification[] = [
    { id: '1', icon: 'pi-graduation-cap', message: 'New student registration submitted', time: '2h ago' },
    { id: '2', icon: 'pi-wallet', message: 'Fee payment received', time: '5h ago' },
  ];

  protected isInactive(branch: Branch): boolean {
    return branch.status === Status.Inactive;
  }

  onBranchChange(branchId: string): void {
    this.branchContext.selectBranch(branchId);
  }

  logout(): void {
    this.router.navigateByUrl('/login');
  }
}
