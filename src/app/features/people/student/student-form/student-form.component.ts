import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { StudentRecord, StudentService } from '../../../../core/services/student.service';
import { PersonType, Status } from '../../../../core/models';

/**
 * Create / edit a student.
 *
 * The page owns the roster and this owns the draft, so the list is only touched
 * once — on a valid save — and a cancelled edit leaves nothing behind.
 */
@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, FormDialogComponent, FormFieldComponent],
  templateUrl: './student-form.component.html',
  host: { class: 'k-form-host' },
})
export class StudentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly studentService = inject(StudentService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly student = input<StudentRecord | null>(null);
  readonly classOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<StudentRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.maxLength(40)]],
    admissionNumber: ['', [Validators.required, (control: AbstractControl) => this.uniqueAdmissionNumber(control)]],
    className: ['', Validators.required],
    status: [Status.Active, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** p-select needs a mutable array; the page hands over a readonly one. */
  protected readonly classChoices = computed(() => [...this.classOptions()]);

  protected readonly isEdit = computed(() => this.student() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    firstName: 'First name',
    lastName: 'Last name',
    admissionNumber: 'Admission no.',
    className: 'Class',
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
    this.visible.set(false);
  }

  private reset(record: StudentRecord | null): void {
    this.form.reset({
      firstName: record?.firstName ?? '',
      lastName: record?.lastName ?? '',
      admissionNumber: record?.studentDetails?.admissionNumber ?? '',
      className: record?.className ?? '',
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
      email: value.email.trim(),
      phone: value.phone.trim(),
      status: value.status,
      className: value.className,
      studentDetails: {
        ...existing?.studentDetails,
        admissionNumber,
        classId: value.className.toLowerCase().replace(/\s+/g, '-'),
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
