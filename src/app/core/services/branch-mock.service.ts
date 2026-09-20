import { Injectable, signal } from '@angular/core';
import { Branch, Status } from '../models';

function branch(id: string, name: string, address: string, phone: string, status: Status = Status.Active): Branch {
  return { id, schoolId: 'school-1', name, address, phone, status };
}

function seedBranches(): Branch[] {
  return [
    // `branch-1` is the branch BranchContextService seeds for the topbar, so the
    // two agree on the id and the name a fresh school starts with.
    branch('branch-1', 'Main Branch', '128 Riverside Avenue, Daun Penh, Phnom Penh', '+1 555-040-4001'),
    branch('branch-2', 'Toul Kork Campus', '45 Street 315, Toul Kork, Phnom Penh', '+1 555-040-4002'),
    branch('branch-3', 'Chamkarmon Campus', '9 Street 63, Chamkarmon, Phnom Penh', '+1 555-040-4003'),
    branch('branch-4', 'Sen Sok Campus', '212 Street 1019, Sen Sok, Phnom Penh', '+1 555-040-4004'),
    branch('branch-5', 'Chroy Changvar Campus', '77 National Road 6A, Chroy Changvar, Phnom Penh', '+1 555-040-4005'),
    branch('branch-6', 'Boeung Keng Kang Centre', '31 Street 278, Boeung Keng Kang, Phnom Penh', '+1 555-040-4006'),
    branch('branch-7', 'Russey Keo Campus', '164 National Road 5, Russey Keo, Phnom Penh', '+1 555-040-4007'),
    branch('branch-8', 'Meanchey Campus', '58 Street 371, Meanchey, Phnom Penh', '+1 555-040-4008'),
    branch('branch-9', 'Siem Reap Campus', '14 Wat Bo Road, Salakamreuk, Siem Reap', '+1 555-040-4009'),
    branch('branch-10', 'Battambang Campus', '6 Street 3, Svay Por, Battambang', '+1 555-040-4010'),
    branch(
      'branch-11',
      'Sihanoukville Centre',
      '89 Ekareach Street, Buon, Preah Sihanouk',
      '+1 555-040-4011',
      Status.Inactive,
    ),
    branch('branch-12', 'Kampot Learning Centre', '23 Riverside Road, Kampong Bay, Kampot', '+1 555-040-4012', Status.Inactive),
  ];
}

/** The branch ids the user and role mocks assign from, so the three stay in step. */
export const BRANCH_IDS: readonly string[] = seedBranches().map((item) => item.id);

/**
 * 62-branches.md — the branch records behind Settings > Branches. Separate from
 * BranchContextService, which owns the single selected branch for the topbar.
 */
@Injectable({ providedIn: 'root' })
export class BranchMockService {
  private readonly _branches = signal<Branch[]>(seedBranches());
  readonly branches = this._branches.asReadonly();
}
