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
import { describeFailure } from '../../../core/api/api-failure';
import { AcademicYearService } from '../../../core/services/academic-year.service';
import { LevelService } from '../../../core/services/level.service';

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
  protected readonly classGroupService = inject(ClassGroupService);
  private readonly levelService = inject(LevelService);
  private readonly academicYearService = inject(AcademicYearService);
  private readonly programService = inject(ProgramService);
  private readonly teacherService = inject(TeacherService);

  protected readonly levelFilter = new RecordFilter<ClassGroupRecord, string>(
    (group, value) => group.levelName === value,
  );

  protected readonly statusFilter = new RecordFilter<ClassGroupRecord, Status>(
    (group, value) => group.status === value,
  );

  /** Four ids on the record, four names in the table. */
  private readonly named = computed<ClassGroupRecord[]>(() => {
    const levels = new Map(this.levelService.levels().map((level) => [level.id, level.name]));
    const programs = new Map(this.programService.programs().map((program) => [program.id, program.name]));
    const years = new Map(this.academicYearService.years().map((year) => [year.id, year.name]));
    const teachers = new Map(
      this.teacherService.teachers().map((teacher) => [teacher.id, `${teacher.firstName} ${teacher.lastName}`]),
    );

    return this.classGroupService.classes().map((group) => ({
      ...group,
      levelName: group.levelId ? (levels.get(group.levelId) ?? '') : '',
      programName: group.programId ? (programs.get(group.programId) ?? '') : '',
      academicYearName: years.get(group.academicYearId) ?? '',
      // Looked up by id. Keying this by the name it was trying to produce
      // meant it could only ever resolve to nothing.
      teacherName: group.homeroomTeacherId ? (teachers.get(group.homeroomTeacherId) ?? '') : '',
    }));
  });

  protected readonly records = createRecordList<ClassGroupRecord>({
    source: this.named,
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

  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

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
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.classGroupService.save(group).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
