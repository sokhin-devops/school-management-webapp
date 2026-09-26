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
import { AcademicYearService } from '../../../core/services/academic-year.service';
import { AcademicYear, AcademicYearStatus } from '../../../core/models';
import { AcademicYearFormComponent } from './academic-year-form/academic-year-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { humanize, readableDate } from '../../../share/data/format';

type Severity = 'success' | 'info' | 'secondary';

/** 25-academic-years.md — name, start, end, status, and optional terms/semesters. */
@Component({
  selector: 'app-academic-year',
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
    AcademicYearFormComponent,
    RecordDrawerComponent,
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
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

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
    this.saveState.run(this.academicYearService.save(year), {
      success: 'Academic year saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<AcademicYear | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: AcademicYear): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: AcademicYear): RecordDetail {
    return {
      title: r.name,
      badge: { label: humanize(r.status), severity: this.severity(r.status) },
      facts: [
        { label: 'Starts', value: readableDate(r.startDate) },
        { label: 'Ends', value: readableDate(r.endDate) },
        { label: 'Terms', value: (r.terms ?? []).map((term) => term.name).join(', '), wide: true },
      ],
    };
  }

  protected confirmRemove(record: AcademicYear, name: string): void {
    this.removal.confirm({
      noun: 'academic year',
      name,
      remove: () => this.academicYearService.remove(record.id),
    });
  }
}
