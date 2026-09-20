import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { Branch, Status } from '../../../core/models';

/**
 * 62-branches.md — Branch Name, Address, Phone, Status. The list is the same one
 * the topbar selector uses, because the selected branch is global.
 */
@Component({
  selector: 'app-branch',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
  ],
  templateUrl: './branch.component.html',
  styleUrl: './branch.component.scss',
})
export class BranchComponent {
  private readonly branchContext = inject(BranchContextService);

  protected readonly statusFilter = new RecordFilter<Branch, Status>(
    (branch, value) => branch.status === value,
  );

  protected readonly records = createRecordList<Branch>({
    source: this.branchContext.branches,
    searchKeys: [(branch) => branch.name, (branch) => branch.address, (branch) => branch.phone],
    sortKeys: {
      name: (branch) => branch.name,
      status: (branch) => branch.status,
    },
    defaultSortField: 'name',
    filters: [this.statusFilter] as never[],
    noun: { one: 'branch', many: 'branches' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected isSelected(branch: Branch): boolean {
    return this.branchContext.selectedBranch().id === branch.id;
  }
}
