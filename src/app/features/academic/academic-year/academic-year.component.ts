import { Component, inject, signal } from '@angular/core';
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
import { AcademicYearFormComponent } from './academic-year-form/academic-year-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';

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
    AcademicYearFormComponent,
  ],
  templateUrl: './academic-year.component.html',
  styleUrl: './academic-year.component.scss',
})
export class AcademicYearComponent {
  protected readonly academicYearService = inject(AcademicYearService);

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
    openOnQuickAdd('academic-year', () => this.openCreate());
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
  /** A save the server refused. */
  protected readonly saveError = signal<string | null>(null);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<AcademicYear | null>(null);

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(year: AcademicYear): void {
    this.editing.set(year);
    this.formVisible.set(true);
  }

  protected onSaved(year: AcademicYear): void {
    this.academicYearService.save(year).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
