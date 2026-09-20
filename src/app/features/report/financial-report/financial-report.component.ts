import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { ListShellComponent } from '../../../share/components';
import { money, percent } from '../../../share/data/format';
import { FinancialRow, ReportService } from '../../../core/services/report.service';

/** 50-reports.md — collection performance by fee category. */
@Component({
  selector: 'app-financial-report',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    SharedModule,
    ListShellComponent,
  ],
  templateUrl: './financial-report.component.html',
  styleUrl: './financial-report.component.scss',
})
export class FinancialReportComponent {
  private readonly reportService = inject(ReportService);

  protected readonly range = signal<Date[] | null>(null);
  protected readonly scope = signal<string | null>(null);

  protected readonly rows = this.reportService.financial;

  protected readonly scopeOptions = computed(() =>
    this.rows().map((row) => ({ label: row.category, value: row.category })),
  );

  protected readonly visible = computed(() => {
    const scope = this.scope();
    return scope ? this.rows().filter((row) => row.category === scope) : this.rows();
  });

  protected readonly figures = computed(() => {
    const rows = this.visible();
    const invoiced = rows.reduce((sum, row) => sum + row.invoiced, 0);
    const collected = rows.reduce((sum, row) => sum + row.collected, 0);

    return [
      { label: 'Invoiced', value: money(invoiced) },
      { label: 'Collected', value: money(collected) },
      { label: 'Outstanding', value: money(invoiced - collected) },
      { label: 'Collection rate', value: percent(invoiced ? (collected / invoiced) * 100 : 0) },
    ];
  });

  protected rate(row: FinancialRow): string {
    return percent(row.invoiced ? (row.collected / row.invoiced) * 100 : 0);
  }

  protected readonly money = money;
}
