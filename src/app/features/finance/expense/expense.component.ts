import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { humanize, money, readableDate } from '../../../share/data/format';
import { ExpenseService } from '../../../core/services/expense.service';
import { Expense, ExpenseStatus } from '../../../core/models';
import { ExpenseFormComponent } from './expense-form/expense-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';

type Severity = 'success' | 'info' | 'warn' | 'danger';

/** 43-expenses.md — school/branch expenses with categories, amounts, dates and status. */
@Component({
  selector: 'app-expense',
  providers: [SaveState],
  imports: [CanDirective, 
    DatePipe,
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    ExpenseFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss',
})
export class ExpenseComponent {
  protected readonly expenseService = inject(ExpenseService);

  protected readonly categoryFilter = new RecordFilter<Expense, string>(
    (expense, value) => expense.category === value,
  );

  protected readonly statusFilter = new RecordFilter<Expense, ExpenseStatus>(
    (expense, value) => expense.status === value,
  );

  protected readonly records = createRecordList<Expense>({
    source: this.expenseService.expenses,
    searchKeys: [(expense) => expense.description, (expense) => expense.category],
    sortKeys: {
      description: (expense) => expense.description ?? '',
      category: (expense) => expense.category,
      amount: (expense) => expense.amount,
      date: (expense) => expense.date,
      status: (expense) => expense.status,
    },
    defaultSortField: 'date',
    filters: [this.categoryFilter, this.statusFilter] as never[],
    noun: { one: 'expense', many: 'expenses' },
  });

  protected readonly statusOptions = Object.values(ExpenseStatus).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly categoryOptions = computed(() =>
    Array.from(new Set(this.expenseService.expenses().map((expense) => expense.category)))
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ label: category, value: category })),
  );

  protected readonly total = computed(() =>
    this.records.matching().reduce((sum, expense) => sum + expense.amount, 0),
  );

  protected readonly money = money;
  protected readonly humanize = humanize;

  constructor() {
    openOnQuickAdd('expense', () => this.openCreate());
    this.records.sortOrder.set(-1);
  }

  protected severity(status: ExpenseStatus): Severity {
    switch (status) {
      case ExpenseStatus.Paid:
        return 'success';
      case ExpenseStatus.Approved:
        return 'info';
      case ExpenseStatus.Pending:
        return 'warn';
      default:
        return 'danger';
    }
  }
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<Expense | null>(null);

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(expense: Expense): void {
    this.editing.set(expense);
    this.formVisible.set(true);
  }

  protected onSaved(expense: Expense): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.expenseService.save(expense), {
      success: 'Expense saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<Expense | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: Expense): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: Expense): RecordDetail {
    return {
      title: r.description || r.category,
      subtitle: r.description ? r.category : undefined,
      badge: { label: humanize(r.status), severity: this.severity(r.status) },
      facts: [
        { label: 'Amount', value: money(r.amount) },
        { label: 'Date', value: readableDate(r.date) },
        { label: 'Category', value: r.category },
        { label: 'Description', value: r.description, wide: true },
      ],
    };
  }

  protected confirmRemove(record: Expense, name: string): void {
    this.removal.confirm({
      noun: 'expense',
      name,
      remove: () => this.expenseService.remove(record.id),
    });
  }
}
