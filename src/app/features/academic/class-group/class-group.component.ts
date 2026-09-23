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
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { ClassGroupRecord, ClassGroupService } from '../../../core/services/class-group.service';
import { Status } from '../../../core/models';
import { ClassGroupFormComponent } from './class-group-form/class-group-form.component';
import { ProgramService } from '../../../core/services/program.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';

type Fill = 'ok' | 'warning' | 'critical';

/**
 * 23-classes.md — classes must express several structures, so the columns are
 * Level and Program rather than a hard-coded "Grade".
 */
@Component({
  selector: 'app-class-group',
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
    ClassGroupFormComponent,
  ],
  templateUrl: './class-group.component.html',
  styleUrl: './class-group.component.scss',
})
export class ClassGroupComponent {
  private readonly classGroupService = inject(ClassGroupService);
  private readonly programService = inject(ProgramService);
  private readonly teacherService = inject(TeacherService);

  protected readonly levelFilter = new RecordFilter<ClassGroupRecord, string>(
    (group, value) => group.levelName === value,
  );

  protected readonly statusFilter = new RecordFilter<ClassGroupRecord, Status>(
    (group, value) => group.status === value,
  );

  protected readonly records = createRecordList<ClassGroupRecord>({
    source: this.classGroupService.classes,
    searchKeys: [
      (group) => group.name,
      (group) => group.code,
      (group) => group.levelName,
      (group) => group.programName,
      (group) => group.teacherName,
    ],
    sortKeys: {
      name: (group) => group.name,
      levelName: (group) => group.levelName,
      teacherName: (group) => group.teacherName,
      enrolled: (group) => group.enrolled,
      status: (group) => group.status,
    },
    defaultSortField: 'name',
    filters: [this.levelFilter, this.statusFilter] as never[],
    noun: { one: 'class', many: 'classes' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly levelOptions = computed(() =>
    Array.from(new Set(this.classGroupService.classes().map((group) => group.levelName)))
      .sort((a, b) => a.localeCompare(b))
      .map((levelName) => ({ label: levelName, value: levelName })),
  );

  protected percentFull(group: ClassGroupRecord): number {
    const capacity = group.capacity ?? 0;
    return capacity ? Math.round((group.enrolled / capacity) * 100) : 0;
  }

  protected fill(group: ClassGroupRecord): Fill {
    const percent = this.percentFull(group);
    return percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : 'ok';
  }
  /** A class is placed on a real programme and given a real member of staff. */
  protected readonly programOptions = computed(() =>
    this.programService
      .programs()
      .map((program) => ({ label: program.name, value: program.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly teacherOptions = computed(() =>
    this.teacherService
      .teachers()
      .map((teacher) => ({ label: `${teacher.firstName} ${teacher.lastName}`, value: `${teacher.firstName} ${teacher.lastName}` }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<ClassGroupRecord | null>(null);

  constructor() {
    openOnQuickAdd('class-group', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(group: ClassGroupRecord): void {
    this.editing.set(group);
    this.formVisible.set(true);
  }

  protected onSaved(group: ClassGroupRecord): void {
    this.classGroupService.upsert(group);
  }
}
