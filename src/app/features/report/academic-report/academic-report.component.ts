import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { ListShellComponent } from '../../../share/components';
import { percent } from '../../../share/data/format';
import { ReportService } from '../../../core/services/report.service';

/** 50-reports.md — assessment outcomes by subject. */
@Component({
  selector: 'app-academic-report',
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
  templateUrl: './academic-report.component.html',
  styleUrl: './academic-report.component.scss',
})
export class AcademicReportComponent {
  private readonly reportService = inject(ReportService);

  protected readonly range = signal<Date[] | null>(null);
  protected readonly scope = signal<string | null>(null);

  protected readonly rows = this.reportService.academic;

  protected readonly scopeOptions = computed(() =>
    this.rows().map((row) => ({ label: row.subject, value: row.subject })),
  );

  protected readonly visible = computed(() => {
    const scope = this.scope();
    return scope ? this.rows().filter((row) => row.subject === scope) : this.rows();
  });

  protected readonly figures = computed(() => {
    const rows = this.visible();
    const assessments = rows.reduce((sum, row) => sum + row.assessments, 0);
    const average = rows.length ? rows.reduce((sum, row) => sum + row.average, 0) / rows.length : 0;
    const passRate = rows.length ? rows.reduce((sum, row) => sum + row.passRate, 0) / rows.length : 0;
    const top = [...rows].sort((a, b) => b.average - a.average)[0];

    return [
      { label: 'Assessments held', value: String(assessments) },
      { label: 'Average score', value: percent(average) },
      { label: 'Pass rate', value: percent(passRate) },
      { label: 'Strongest subject', value: top?.subject ?? '—' },
    ];
  });

  protected readonly percent = percent;
}
