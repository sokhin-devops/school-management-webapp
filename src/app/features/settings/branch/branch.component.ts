import { Component, computed, inject, signal } from '@angular/core';
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
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { Branch, Status } from '../../../core/models';
import { BranchFormComponent } from './branch-form/branch-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { statusBadge } from '../../../share/data/format';

/**
 * 62-branches.md — Branch Name, Address, Phone, Status. The list is the same one
 * the topbar selector uses, because the selected branch is global.
 */
@Component({
  selector: 'app-branch',
  providers: [SaveState],
  imports: [CanDirective, 
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
    BranchFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './branch.component.html',
  styleUrl: './branch.component.scss',
})
export class BranchComponent {
  private readonly branchContext = inject(BranchContextService);
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

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
    return this.branchContext.selectedBranch()?.id === branch.id;
  }
  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<Branch | null>(null);

  constructor() {
    openOnQuickAdd('branch', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(branch: Branch): void {
    this.editing.set(branch);
    this.formVisible.set(true);
  }

  protected onSaved(branch: Branch): void {
    // The service reloads once the server has the branch, so the list and the
    // topbar switcher both show what was stored rather than what was sent.
    this.saveState.run(this.branchContext.save(branch), {
      success: 'Branch saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<Branch | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: Branch): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: Branch): RecordDetail {
    return {
      title: r.name,
      subtitle: r.mainBranch ? 'Main branch' : undefined,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Phone', value: r.phone },
        { label: 'Main branch', value: r.mainBranch ? 'Yes' : 'No' },
        { label: 'Address', value: r.address, wide: true },
      ],
    };
  }

  protected confirmRemove(branch: Branch, name: string): void {
    this.removal.confirm({
      noun: 'branch',
      name,
      consequence: branch.mainBranch
        ? 'It is the main branch, so another branch becomes the main one.'
        : undefined,
      remove: () => this.branchContext.remove(branch.id),
    });
  }
}
