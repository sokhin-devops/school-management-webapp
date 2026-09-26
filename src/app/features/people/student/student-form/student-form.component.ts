import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { ClassGroupService } from '../../../../core/services/class-group.service';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { StudentRecord, StudentService } from '../../../../core/services/student.service';
import { PersonType, Status } from '../../../../core/models';
import { ApiGender } from '../../../../core/api/api.models';
import { fromDate, toDate } from '../../../../core/api/api-mappers';

/**
 * Create / edit a student.
 *
 * The page owns the roster and this owns the draft, so the list is only touched
 * once — on a valid save — and a cancelled edit leaves nothing behind.
 */
@Component({
  selector: 'app-student-form',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './student-form.component.html',
  host: { class: 'k-form-host' },
})
export class StudentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly classGroups = inject(ClassGroupService);
  private readonly studentService = inject(StudentService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly student = input<StudentRecord | null>(null);

  readonly saved = output<StudentRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.maxLength(40)]],
    admissionNumber: ['', [Validators.required, (control: AbstractControl) => this.uniqueAdmissionNumber(control)]],
    // By id, and optional: a student can be admitted before being placed.
    classGroupId: [''],
    // All three are required by the API. They used to be absent from the form,
    // so the service sent placeholders and every student was saved with the
    // same invented date of birth.
    gender: ['OTHER' as ApiGender, Validators.required],
    dateOfBirth: [null as Date | null, Validators.required],
    admissionDate: [null as Date | null, Validators.required],
    status: [Status.Active, Validators.required],
    // Optional, as the API has it: plenty of students have no address of their own.
    email: ['', Validators.email],
    phone: [''],
  });

  /** Nobody was born tomorrow, and nobody joined the school tomorrow either. */
  protected readonly today = new Date();

  protected readonly genderOptions: { label: string; value: ApiGender }[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
  ];

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** p-select needs a mutable array; the page hands over a readonly one. */
  /** Real classes, by id. The page used to offer only classes other students were already in. */
  protected readonly classChoices = computed(() =>
    this.classGroups
      .classes()
      .map((group) => ({ label: group.name, value: group.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly isEdit = computed(() => this.student() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    firstName: 'First name',
    lastName: 'Last name',
    admissionNumber: 'Admission no.',
    classGroupId: 'Class',
    gender: 'Gender',
    dateOfBirth: 'Date of birth',
    admissionDate: 'Admission date',
    status: 'Status',
    email: 'Email',
    phone: 'Phone',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.student();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: StudentRecord | null): void {
    this.form.reset({
      firstName: record?.firstName ?? '',
      lastName: record?.lastName ?? '',
      admissionNumber: record?.studentDetails?.admissionNumber ?? '',
      classGroupId: record?.classGroupId ?? '',
      gender: record?.gender ?? 'OTHER',
      dateOfBirth: toDate(record?.dateOfBirth),
      admissionDate: toDate(record?.admissionDate) ?? new Date(),
      status: record?.status ?? Status.Active,
      email: record?.email ?? '',
      phone: record?.phone ?? '',
    });
  }

  private toRecord(): StudentRecord {
    const value = this.form.getRawValue();
    const existing = this.student();
    const admissionNumber = value.admissionNumber.trim();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchIds: existing?.branchIds ?? [this.branchContext.selectedBranch()?.id ?? ''],
      type: PersonType.Student,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim() || undefined,
      phone: value.phone.trim(),
      status: value.status,
      classGroupId: value.classGroupId || undefined,
      className: this.classChoices().find((choice) => choice.value === value.classGroupId)?.label ?? '',
      gender: value.gender,
      dateOfBirth: fromDate(value.dateOfBirth) ?? undefined,
      admissionDate: fromDate(value.admissionDate) ?? undefined,
      studentDetails: {
        ...existing?.studentDetails,
        admissionNumber,
        classId: value.classGroupId || undefined,
      },
    };
  }

  /**
   * The admission number is the record's identity, so a duplicate would quietly
   * overwrite another student instead of adding one.
   */
  private uniqueAdmissionNumber(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toLowerCase();
    if (!entered) {
      return null;
    }
    const editingId = this.student()?.id ?? null;
    const taken = this.studentService
      .students()
      .some(
        (other) =>
          other.id !== editingId && (other.studentDetails?.admissionNumber ?? '').toLowerCase() === entered,
      );
    return taken ? { message: 'That admission number already belongs to another student.' } : null;
  }
}
