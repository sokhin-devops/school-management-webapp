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
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { money } from '../../../share/data/format';
import { FeeService } from '../../../core/services/fee.service';
import { Fee, Status } from '../../../core/models';
import { FeeFormComponent } from './fee-form/fee-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';

/** 41-fees.md — configurable charges: tuition, registration, transportation, materials. */
@Component({
  selector: 'app-fee',
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
    FeeFormComponent,
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
  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

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
    this.feeService.save(fee).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
