import { Component, inject } from '@angular/core';
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
import { AcademicYearService } from '../../../core/services/academic-year.service';
import { AcademicYear, AcademicYearStatus } from '../../../core/models';

type Severity = 'success' | 'info' | 'secondary';

/** 25-academic-years.md — name, start, end, status, and optional terms/semesters. */
@Component({
  selector: 'app-academic-year',
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
  templateUrl: './academic-year.component.html',
  styleUrl: './academic-year.component.scss',
})
export class AcademicYearComponent {
  private readonly academicYearService = inject(AcademicYearService);

  protected readonly statusFilter = new RecordFilter<AcademicYear, AcademicYearStatus>(
    (year, value) => year.status === value,
  );

  protected readonly records = createRecordList<AcademicYear>({
    source: this.academicYearService.years,
    searchKeys: [(year) => year.name, (year) => year.status],
    sortKeys: {
      name: (year) => year.name,
      startDate: (year) => year.startDate,
      status: (year) => year.status,
    },
    // Newest first: the year people need is almost always the current one.
    defaultSortField: 'startDate',
    filters: [this.statusFilter] as never[],
    noun: { one: 'academic year', many: 'academic years' },
    pageSize: 12,
  });

  protected readonly statusOptions = [
    { label: 'Active', value: AcademicYearStatus.Active },
    { label: 'Upcoming', value: AcademicYearStatus.Upcoming },
    { label: 'Completed', value: AcademicYearStatus.Completed },
  ];

  constructor() {
    this.records.sortOrder.set(-1);
  }

  /** AcademicYearStatus is its own enum, so k-status-tag (active/inactive) does not apply. */
  protected severity(status: AcademicYearStatus): Severity {
    switch (status) {
      case AcademicYearStatus.Active:
        return 'success';
      case AcademicYearStatus.Upcoming:
        return 'info';
      default:
        return 'secondary';
    }
  }

  protected label(status: AcademicYearStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
