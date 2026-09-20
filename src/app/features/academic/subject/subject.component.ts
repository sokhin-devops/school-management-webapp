import { Component, inject } from '@angular/core';
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
  ],
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
})
export class SubjectComponent {
  private readonly subjectService = inject(SubjectService);

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
}
