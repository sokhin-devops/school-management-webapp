import { Injectable, computed, inject, signal } from '@angular/core';
import { Branch, Status } from '../models';
import { OnboardingService } from './onboarding.service';

/**
 * Holds the global selected-branch state for the topbar (06-topbar.md).
 * Seeds from the branch created during onboarding when available.
 */
@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private readonly onboarding = inject(OnboardingService);

  private readonly _branches = signal<Branch[]>(this.seedBranches());
  private readonly _selectedBranchId = signal(this._branches()[0].id);

  readonly branches = this._branches.asReadonly();
  readonly selectedBranch = computed(
    () => this._branches().find((branch) => branch.id === this._selectedBranchId()) ?? this._branches()[0],
  );

  selectBranch(branchId: string): void {
    this._selectedBranchId.set(branchId);
  }

  private seedBranches(): Branch[] {
    return [
      {
        id: 'branch-1',
        schoolId: 'school-1',
        name: this.onboarding.branch?.name ?? 'Main Branch',
        status: Status.Active,
      },
    ];
  }
}
