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
import { AttendanceRow, ReportService } from '../../../core/services/report.service';

/** 50-reports.md — attendance reporting across classes. */
@Component({
  selector: 'app-attendance-report',
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
  templateUrl: './attendance-report.component.html',
  styleUrl: './attendance-report.component.scss',
})
export class AttendanceReportComponent {
  private readonly reportService = inject(ReportService);

  protected readonly range = signal<Date[] | null>(null);
  protected readonly scope = signal<string | null>(null);

  protected readonly rows = this.reportService.attendance;

  protected readonly scopeOptions = computed(() =>
    this.rows().map((row) => ({ label: row.className, value: row.className })),
  );

  protected readonly visible = computed(() => {
    const scope = this.scope();
    return scope ? this.rows().filter((row) => row.className === scope) : this.rows();
  });

  protected readonly figures = computed(() => {
    const rows = this.visible();
    const present = rows.reduce((sum, row) => sum + row.present, 0);
    const absent = rows.reduce((sum, row) => sum + row.absent, 0);
    const late = rows.reduce((sum, row) => sum + row.late, 0);
    const sessions = rows.reduce((sum, row) => sum + row.sessions, 0);
    const marks = present + absent;

    return [
      { label: 'Average attendance', value: percent(marks ? (present / marks) * 100 : 0) },
      { label: 'Sessions recorded', value: String(sessions) },
      { label: 'Absences', value: String(absent) },
      { label: 'Late arrivals', value: String(late) },
    ];
  });

  protected rate(row: AttendanceRow): string {
    const marks = row.present + row.absent;
    return percent(marks ? (row.present / marks) * 100 : 0);
  }
}
