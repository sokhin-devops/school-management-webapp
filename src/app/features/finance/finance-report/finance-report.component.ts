import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { ListShellComponent } from '../../../share/components';
import { money } from '../../../share/data/format';
import { LedgerRow, ReportService } from '../../../core/services/report.service';

/**
 * 40-finance.md — the finance module's own month-by-month view. The Reports
 * module's financial report answers a different question (collection by fee
 * category), so the two are not duplicates.
 */
@Component({
  selector: 'app-finance-report',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    TableModule,
    SharedModule,
    ListShellComponent,
  ],
  templateUrl: './finance-report.component.html',
  styleUrl: './finance-report.component.scss',
})
export class FinanceReportComponent {
  private readonly reportService = inject(ReportService);

  protected readonly range = signal<Date[] | null>(null);

  protected readonly rows = this.reportService.ledger;

  protected readonly figures = computed(() => {
    const rows = this.rows();
    const collected = rows.reduce((sum, row) => sum + row.collected, 0);
    const outstanding = rows[rows.length - 1]?.outstanding ?? 0;
    const expenses = rows.reduce((sum, row) => sum + row.expenses, 0);

    return [
      { label: 'Collected', value: money(collected) },
      // A balance, not a flow — summing six months of it would be meaningless.
      { label: 'Outstanding now', value: money(outstanding) },
      { label: 'Expenses', value: money(expenses) },
      { label: 'Net', value: money(collected - expenses) },
    ];
  });

  protected net(row: LedgerRow): number {
    return row.collected - row.expenses;
  }

  protected readonly money = money;
}
