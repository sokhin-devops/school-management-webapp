import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { SubjectService } from '../../../core/services/subject.service';
import { Status, Subject } from '../../../core/models';
import { SubjectFormComponent } from './subject-form/subject-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';

/** 24-subjects.md — configurable academic offerings (Mathematics, Programming, Speaking...). */
@Component({
  selector: 'app-subject',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
    SubjectFormComponent,
  ],
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
})
export class SubjectComponent {
  protected readonly subjectService = inject(SubjectService);

  protected readonly statusFilter = new RecordFilter<Subject, Status>(
    (subject, value) => subject.status === value,
  );

  protected readonly records = createRecordList<Subject>({
    source: this.subjectService.subjects,
    searchKeys: [(subject) => subject.name, (subject) => subject.code, (subject) => subject.description],
    sortKeys: {
      name: (subject) => subject.name,
      code: (subject) => subject.code ?? '',
      status: (subject) => subject.status,
    },
    defaultSortField: 'name',
    filters: [this.statusFilter] as never[],
    noun: { one: 'subject', many: 'subjects' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];
  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<Subject | null>(null);

  constructor() {
    openOnQuickAdd('subject', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(subject: Subject): void {
    this.editing.set(subject);
    this.formVisible.set(true);
  }

  protected onSaved(subject: Subject): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.subjectService.save(subject).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
