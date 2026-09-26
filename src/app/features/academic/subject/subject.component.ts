import { Component, computed, inject, signal } from '@angular/core';
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
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { SubjectService } from '../../../core/services/subject.service';
import { Status, Subject } from '../../../core/models';
import { SubjectFormComponent } from './subject-form/subject-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { statusBadge } from '../../../share/data/format';

/** 24-subjects.md — configurable academic offerings (Mathematics, Programming, Speaking...). */
@Component({
  selector: 'app-subject',
  providers: [SaveState],
  imports: [CanDirective, 
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
    RecordDrawerComponent,
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
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

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
    this.saveState.run(this.subjectService.save(subject), {
      success: 'Subject saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<Subject | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: Subject): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: Subject): RecordDetail {
    return {
      title: r.name,
      subtitle: r.code,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Code', value: r.code },
        { label: 'Description', value: r.description, wide: true },
      ],
    };
  }

  protected confirmRemove(record: Subject, name: string): void {
    this.removal.confirm({
      noun: 'subject',
      name,
      remove: () => this.subjectService.remove(record.id),
    });
  }
}
