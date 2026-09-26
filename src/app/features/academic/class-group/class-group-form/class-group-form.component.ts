import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { AcademicYearService } from '../../../../core/services/academic-year.service';
import { AcademicSettingsService } from '../../../../core/services/academic-settings.service';
import { ClassGroupRecord, ClassGroupService } from '../../../../core/services/class-group.service';
import { LevelService } from '../../../../core/services/level.service';
import { ProgramService } from '../../../../core/services/program.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { AcademicYearStatus, Status } from '../../../../core/models';

interface Choice {
  label: string;
  value: string;
}

/**
 * Create / edit a class - 23-classes.md: "Grade 1 -> Class 1-A", "Program ->
 * Year 2 -> Section A", "Course -> Intermediate -> Batch 03".
 *
 * Every link is chosen by id from the records that exist, rather than typed as
 * a name: the server keeps ids, and a name that matched nothing used to be sent
 * as nothing. Only the year is required; level, program, section and teacher
 * each apply only where the school uses them.
 */
@Component({
  selector: 'app-class-group-form',
  imports: [ReactiveFormsModule, InputNumberModule, InputTextModule, SelectModule, FormDialogComponent, FormFieldComponent],
  templateUrl: './class-group-form.component.html',
  host: { class: 'k-form-host' },
})
export class ClassGroupFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);
  private readonly years = inject(AcademicYearService);
  private readonly levels = inject(LevelService);
  private readonly programs = inject(ProgramService);
  private readonly teachers = inject(TeacherService);
  private readonly classes = inject(ClassGroupService);
  protected readonly academic = inject(AcademicSettingsService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly group = input<ClassGroupRecord | null>(null);

  readonly saved = output<ClassGroupRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    // Required, as the API has it: timetables and reports refer to classes by code.
    code: ['', [Validators.required, Validators.maxLength(30)]],
    academicYearId: ['', Validators.required],
    levelId: [''],
    programId: [''],
    parentClassId: [''],
    homeroomTeacherId: [''],
    capacity: [30, [Validators.required, Validators.min(1), Validators.max(200)]],
    status: [Status.Active, Validators.required],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly yearChoices = computed<Choice[]>(() =>
    this.years.years().map((year) => ({
      label: year.status === AcademicYearStatus.Active ? `${year.name} (current)` : year.name,
      value: year.id,
    })),
  );
  protected readonly levelChoices = computed<Choice[]>(() =>
    this.levels
      .levels()
      // The name, not displayLabel: that is the level's kind ("Grade"), shared by
      // every level of that kind.
      .map((level) => ({ label: level.name, value: level.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  protected readonly programChoices = computed<Choice[]>(() =>
    this.programs
      .programs()
      .map((program) => ({ label: program.name, value: program.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  protected readonly teacherChoices = computed<Choice[]>(() =>
    this.teachers
      .teachers()
      .map((teacher) => ({ label: `${teacher.firstName} ${teacher.lastName}`, value: teacher.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  /** A class can be a section of any other class - never of itself. */
  protected readonly parentChoices = computed<Choice[]>(() => {
    const self = this.group()?.id;
    return this.classes
      .classes()
      .filter((group) => group.id !== self)
      .map((group) => ({ label: group.name, value: group.id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  protected readonly isEdit = computed(() => this.group() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    code: 'Code',
    academicYearId: 'Academic year',
    levelId: 'Level',
    programId: 'Program',
    parentClassId: 'Section of',
    homeroomTeacherId: 'Class teacher',
    capacity: 'Capacity',
    status: 'Status',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.group();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: ClassGroupRecord | null): void {
    const current = this.years.years().find((year) => year.status === AcademicYearStatus.Active);
    this.form.reset({
      name: record?.name ?? '',
      code: record?.code ?? '',
      // A new class goes into the year the school is working in.
      academicYearId: record?.academicYearId ?? current?.id ?? '',
      levelId: record?.levelId ?? '',
      programId: record?.programId ?? '',
      parentClassId: record?.parentClassId ?? '',
      homeroomTeacherId: record?.homeroomTeacherId ?? '',
      capacity: record?.capacity ?? 30,
      status: record?.status ?? Status.Active,
    });
  }

  private toRecord(): ClassGroupRecord {
    const value = this.form.getRawValue();
    const existing = this.group();
    const label = (choices: Choice[], id: string) => choices.find((choice) => choice.value === id)?.label ?? '';
    const settings = this.academic.settings();

    // A concept the school has switched off is cleared rather than kept
    // invisibly: a hidden link the reader cannot see or change is a trap.
    const levelId = settings.useLevels ? value.levelId : '';
    const programId = settings.usePrograms ? value.programId : '';
    const parentClassId = settings.useSections ? value.parentClassId : '';

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      academicYearId: value.academicYearId,
      academicYearName: label(this.yearChoices(), value.academicYearId),
      levelId: levelId || undefined,
      levelName: label(this.levelChoices(), levelId),
      programId: programId || undefined,
      programName: label(this.programChoices(), programId),
      parentClassId: parentClassId || undefined,
      homeroomTeacherId: value.homeroomTeacherId || undefined,
      teacherName: label(this.teacherChoices(), value.homeroomTeacherId),
      name: value.name.trim(),
      code: value.code.trim(),
      // Enrolment is a consequence of admissions, not something typed in here.
      enrolled: existing?.enrolled ?? 0,
      capacity: value.capacity,
      status: value.status,
    };
  }
}
