import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { ClassGroupRecord } from '../../../../core/services/class-group.service';
import { Status } from '../../../../core/models';

/** Create / edit a class. */
@Component({
  selector: 'app-class-group-form',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './class-group-form.component.html',
  host: { class: 'k-form-host' },
})
export class ClassGroupFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly group = input<ClassGroupRecord | null>(null);
  readonly levelOptions = input<readonly { label: string; value: string }[]>([]);
  readonly programOptions = input<readonly { label: string; value: string }[]>([]);
  readonly teacherOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<ClassGroupRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    code: [''],
    levelName: ['', Validators.required],
    programName: ['', Validators.required],
    teacherName: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1), Validators.max(200)]],
    status: [Status.Active, Validators.required],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly levelChoices = computed(() => [...this.levelOptions()]);
  protected readonly programChoices = computed(() => [...this.programOptions()]);
  protected readonly teacherChoices = computed(() => [...this.teacherOptions()]);

  protected readonly isEdit = computed(() => this.group() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    code: 'Code',
    levelName: 'Level',
    programName: 'Programme',
    teacherName: 'Class teacher',
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
    this.visible.set(false);
  }

  private reset(record: ClassGroupRecord | null): void {
    this.form.reset({
      name: record?.name ?? '',
      code: record?.code ?? '',
      levelName: record?.levelName ?? '',
      programName: record?.programName ?? '',
      teacherName: record?.teacherName ?? '',
      capacity: record?.capacity ?? 30,
      status: record?.status ?? Status.Active,
    });
  }

  private toRecord(): ClassGroupRecord {
    const value = this.form.getRawValue();
    const existing = this.group();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      academicYearId: existing?.academicYearId ?? 'ay-2026',
      academicYearName: existing?.academicYearName ?? '2026 - 2027',
      name: value.name.trim(),
      code: value.code.trim(),
      levelName: value.levelName,
      programName: value.programName,
      teacherName: value.teacherName,
      // Enrolment is a consequence of admissions, not something typed in here.
      enrolled: existing?.enrolled ?? 0,
      capacity: value.capacity,
      status: value.status,
    };
  }
}
