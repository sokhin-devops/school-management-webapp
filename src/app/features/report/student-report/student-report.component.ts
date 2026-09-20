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

/** 50-reports.md — enrolment and roster reporting. */
@Component({
  selector: 'app-student-report',
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
  templateUrl: './student-report.component.html',
  styleUrl: './student-report.component.scss',
})
export class StudentReportComponent {
  private readonly reportService = inject(ReportService);

  protected readonly range = signal<Date[] | null>(null);
  protected readonly scope = signal<string | null>(null);

  protected readonly rows = this.reportService.enrolment;

  protected readonly scopeOptions = computed(() =>
    this.rows().map((row) => ({ label: row.className, value: row.className })),
  );

  protected readonly visible = computed(() => {
    const scope = this.scope();
    return scope ? this.rows().filter((row) => row.className === scope) : this.rows();
  });

  protected readonly figures = computed(() => {
    const rows = this.visible();
    const enrolled = rows.reduce((sum, row) => sum + row.enrolled, 0);
    const active = rows.reduce((sum, row) => sum + row.active, 0);
    const capacity = rows.reduce((sum, row) => sum + row.capacity, 0);

    return [
      { label: 'Students enrolled', value: String(enrolled) },
      { label: 'Active', value: String(active) },
      { label: 'Inactive', value: String(enrolled - active) },
      { label: 'Places remaining', value: String(capacity - enrolled) },
    ];
  });

  protected utilisation(enrolled: number, capacity: number): string {
    return percent(capacity ? (enrolled / capacity) * 100 : 0);
  }
}
