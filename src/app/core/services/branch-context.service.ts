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

  /**
   * The topbar selector and Settings > Branches read the same list — 62-branches.md
   * says the selected branch is global, so there is only ever one source for it.
   * The first entry carries whatever name onboarding captured.
   */
  private seedBranches(): Branch[] {
    return [
      {
        id: 'branch-1',
        schoolId: 'school-1',
        name: this.onboarding.branch?.name ?? 'Main Branch',
        address: '128 Riverside Avenue, Phnom Penh',
        phone: '+1 555-000-1000',
        status: Status.Active,
      },
      {
        id: 'branch-2',
        schoolId: 'school-1',
        name: 'Riverside North',
        address: '42 Norodom Boulevard, Phnom Penh',
        phone: '+1 555-000-1002',
        status: Status.Active,
      },
      {
        id: 'branch-3',
        schoolId: 'school-1',
        name: 'Riverside East',
        address: '9 Sihanouk Street, Phnom Penh',
        phone: '+1 555-000-1003',
        status: Status.Active,
      },
      {
        id: 'branch-4',
        schoolId: 'school-1',
        name: 'Language Centre',
        address: '77 Monivong Boulevard, Phnom Penh',
        phone: '+1 555-000-1004',
        status: Status.Active,
      },
      {
        id: 'branch-5',
        schoolId: 'school-1',
        name: 'Siem Reap Campus',
        address: '15 Charles de Gaulle, Siem Reap',
        phone: '+1 555-000-1005',
        status: Status.Inactive,
      },
    ];
  }
}
