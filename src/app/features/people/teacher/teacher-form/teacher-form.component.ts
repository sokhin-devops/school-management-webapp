import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { TeacherRecord, TeacherService } from '../../../../core/services/teacher.service';
import { PersonType, Status } from '../../../../core/models';

/** Create / edit a teacher. */
@Component({
  selector: 'app-teacher-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './teacher-form.component.html',
  host: { class: 'k-form-host' },
})
export class TeacherFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly teacherService = inject(TeacherService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  readonly teacher = input<TeacherRecord | null>(null);
  readonly departmentOptions = input<readonly { label: string; value: string }[]>([]);
  readonly subjectOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<TeacherRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.maxLength(40)]],
    employeeNumber: ['', [Validators.required, (control: AbstractControl) => this.uniqueEmployeeNumber(control)]],
    department: ['', Validators.required],
    subjects: [[] as string[], Validators.required],
    status: [Status.Active, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly departmentChoices = computed(() => [...this.departmentOptions()]);
  protected readonly subjectChoices = computed(() => [...this.subjectOptions()]);

  protected readonly isEdit = computed(() => this.teacher() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    firstName: 'First name',
    lastName: 'Last name',
    employeeNumber: 'Employee no.',
    department: 'Department',
    subjects: 'Subjects',
    status: 'Status',
    email: 'Email',
    phone: 'Phone',
  } as const;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.teacher();
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

  private reset(record: TeacherRecord | null): void {
    this.form.reset({
      firstName: record?.firstName ?? '',
      lastName: record?.lastName ?? '',
      employeeNumber: record?.teacherDetails?.employeeNumber ?? '',
      department: record?.department ?? '',
      subjects: [...(record?.subjects ?? [])],
      status: record?.status ?? Status.Active,
      email: record?.email ?? '',
      phone: record?.phone ?? '',
    });
  }

  private toRecord(): TeacherRecord {
    const value = this.form.getRawValue();
    const existing = this.teacher();
    const employeeNumber = value.employeeNumber.trim();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchIds: existing?.branchIds ?? [this.branchContext.selectedBranch()?.id ?? ''],
      type: PersonType.Teacher,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      status: value.status,
      department: value.department,
      subjects: value.subjects,
      teacherDetails: {
        ...existing?.teacherDetails,
        employeeNumber,
        subjectIds: value.subjects.map((subject) => subject.toLowerCase().replace(/\s+/g, '-')),
      },
    };
  }

  /** The employee number is the record's identity, so it cannot be shared. */
  private uniqueEmployeeNumber(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toLowerCase();
    if (!entered) {
      return null;
    }
    const editingId = this.teacher()?.id ?? null;
    const taken = this.teacherService
      .teachers()
      .some(
        (other) =>
          other.id !== editingId && (other.teacherDetails?.employeeNumber ?? '').toLowerCase() === entered,
      );
    return taken ? { message: 'That employee number already belongs to another teacher.' } : null;
  }
}
