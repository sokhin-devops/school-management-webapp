import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { DataViewModule } from 'primeng/dataview';
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
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { TeacherRecord, TeacherService } from '../../../core/services/teacher.service';
import { SubjectService } from '../../../core/services/subject.service';
import { Status } from '../../../core/models';
import { TeacherCardComponent } from './teacher-card/teacher-card.component';
import { TeacherFormComponent } from './teacher-form/teacher-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { statusBadge } from '../../../share/data/format';

@Component({
  selector: 'app-teacher',
  providers: [SaveState],
  imports: [CanDirective, 
    FormsModule,
    ButtonModule,
    SelectModule,
    AvatarModule,
    DataViewModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
    TeacherCardComponent,
    TeacherFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './teacher.component.html',
  styleUrl: './teacher.component.scss',
})
export class TeacherComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  protected readonly teacherService = inject(TeacherService);
  private readonly subjectService = inject(SubjectService);

  protected readonly departmentFilter = new RecordFilter<TeacherRecord, string>(
    (teacher, value) => teacher.department === value,
  );

  protected readonly statusFilter = new RecordFilter<TeacherRecord, Status>(
    (teacher, value) => teacher.status === value,
  );

  /** The API stores subjectIds; the card and the table show the names. */
  private readonly named = computed<TeacherRecord[]>(() => {
    const subjects = new Map(this.subjectService.subjects().map((subject) => [subject.id, subject.name]));
    return this.teacherService.teachers().map((teacher) => ({
      ...teacher,
      subjects: (teacher.teacherDetails?.subjectIds ?? [])
        .map((id) => subjects.get(id) ?? '')
        .filter((name) => name !== ''),
    }));
  });

  protected readonly records = createRecordList<TeacherRecord>({
    source: this.named,
    searchKeys: [
      (teacher) => teacher.firstName,
      (teacher) => teacher.lastName,
      (teacher) => `${teacher.firstName} ${teacher.lastName}`,
      (teacher) => teacher.teacherDetails?.employeeNumber,
      (teacher) => teacher.department,
      (teacher) => teacher.subjects.join(' '),
      (teacher) => teacher.email,
      (teacher) => teacher.phone,
    ],
    sortKeys: {
      // Surname first: a staff list ordered by given name is not one anyone reads.
      name: (teacher) => `${teacher.lastName} ${teacher.firstName}`,
      employeeNumber: (teacher) => teacher.teacherDetails?.employeeNumber ?? '',
      department: (teacher) => teacher.department,
      status: (teacher) => teacher.status,
    },
    defaultSortField: 'name',
    filters: [this.departmentFilter, this.statusFilter] as never[],
    noun: { one: 'teacher', many: 'teachers' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** Built from the loaded staff, so the dropdown always matches the data. */
  protected readonly departmentOptions = computed(() =>
    Array.from(new Set(this.teacherService.teachers().map((teacher) => teacher.department)))
      .sort((a, b) => a.localeCompare(b))
      .map((department) => ({ label: department, value: department })),
  );

  protected fullName(teacher: TeacherRecord): string {
    return `${teacher.firstName} ${teacher.lastName}`;
  }

  protected initials(teacher: TeacherRecord): string {
    return `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  }
  /** The subjects a teacher can be assigned, from the subject catalogue. */
  protected readonly subjectOptions = computed(() =>
    this.subjectService
      .subjects()
      .map((subject) => ({ label: subject.name, value: subject.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<TeacherRecord | null>(null);

  constructor() {
    openOnQuickAdd('teacher', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(teacher: TeacherRecord): void {
    this.editing.set(teacher);
    this.formVisible.set(true);
  }

  protected onSaved(teacher: TeacherRecord): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.teacherService.save(teacher), {
      success: 'Teacher saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<TeacherRecord | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: TeacherRecord): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: TeacherRecord): RecordDetail {
    return {
      title: this.fullName(r),
      subtitle: r.teacherDetails?.employeeNumber,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Department', value: r.department },
        { label: 'Employee no.', value: r.teacherDetails?.employeeNumber },
        { label: 'Phone', value: r.phone },
        { label: 'Email', value: r.email, wide: true },
        { label: 'Subjects', value: r.subjects.join(', '), wide: true },
      ],
    };
  }

  protected confirmRemove(record: TeacherRecord, name: string): void {
    this.removal.confirm({
      noun: 'teacher',
      name,
      remove: () => this.teacherService.remove(record.id),
    });
  }
}
