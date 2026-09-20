import { Component, computed, inject } from '@angular/core';
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
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { humanize, money } from '../../../share/data/format';
import { ExpenseService } from '../../../core/services/expense.service';
import { Expense, ExpenseStatus } from '../../../core/models';

type Severity = 'success' | 'info' | 'warn' | 'danger';

/** 43-expenses.md — school/branch expenses with categories, amounts, dates and status. */
@Component({
  selector: 'app-expense',
  imports: [
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
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss',
})
export class ExpenseComponent {
  private readonly expenseService = inject(ExpenseService);

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
}
