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
import { money, statusBadge } from '../../../share/data/format';
import { FeeService } from '../../../core/services/fee.service';
import { Fee, Status } from '../../../core/models';
import { FeeFormComponent } from './fee-form/fee-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';

/** 41-fees.md — configurable charges: tuition, registration, transportation, materials. */
@Component({
  selector: 'app-fee',
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
    FeeFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './fee.component.html',
  styleUrl: './fee.component.scss',
})
export class FeeComponent {
  protected readonly feeService = inject(FeeService);

  protected readonly categoryFilter = new RecordFilter<Fee, string>((fee, value) => fee.category === value);
  protected readonly statusFilter = new RecordFilter<Fee, Status>((fee, value) => fee.status === value);

  protected readonly records = createRecordList<Fee>({
    source: this.feeService.fees,
    searchKeys: [(fee) => fee.name, (fee) => fee.category, (fee) => fee.description],
    sortKeys: {
      name: (fee) => fee.name,
      category: (fee) => fee.category ?? '',
      amount: (fee) => fee.amount,
      status: (fee) => fee.status,
    },
    defaultSortField: 'name',
    filters: [this.categoryFilter, this.statusFilter] as never[],
    noun: { one: 'fee', many: 'fees' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly categoryOptions = computed(() =>
    Array.from(new Set(this.feeService.fees().map((fee) => fee.category ?? '')))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ label: category, value: category })),
  );

  protected readonly money = money;
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<Fee | null>(null);

  constructor() {
    openOnQuickAdd('fee', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(fee: Fee): void {
    this.editing.set(fee);
    this.formVisible.set(true);
  }

  protected onSaved(fee: Fee): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.feeService.save(fee), {
      success: 'Fee saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<Fee | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: Fee): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: Fee): RecordDetail {
    return {
      title: r.name,
      subtitle: r.category,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Amount', value: money(r.amount) },
        { label: 'Category', value: r.category },
        { label: 'Description', value: r.description, wide: true },
      ],
    };
  }

  protected confirmRemove(record: Fee, name: string): void {
    this.removal.confirm({
      noun: 'fee',
      name,
      remove: () => this.feeService.remove(record.id),
    });
  }
}
