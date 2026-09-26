import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { ParentRecord } from '../../../../core/services/parent.service';
import { StudentService } from '../../../../core/services/student.service';
import { PersonType, Status } from '../../../../core/models';

/** Create / edit a parent or guardian. */
@Component({
  selector: 'app-parent-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './parent-form.component.html',
  host: { class: 'k-form-host' },
})
export class ParentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly studentService = inject(StudentService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  readonly parent = input<ParentRecord | null>(null);

  readonly saved = output<ParentRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.maxLength(40)]],
    relationship: ['', Validators.required],
    // By id, and optional: a parent can be registered before their child is.
    studentIds: [[] as string[]],
    status: [Status.Active, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  protected readonly relationshipOptions = ['Father', 'Mother', 'Guardian'].map((value) => ({ label: value, value }));

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** Children are picked from the roster by id, so a parent cannot be linked to a student who does not exist. */
  protected readonly childOptions = computed(() =>
    this.studentService
      .students()
      .map((student) => ({ label: `${student.firstName} ${student.lastName}`, value: student.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly isEdit = computed(() => this.parent() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    firstName: 'First name',
    lastName: 'Last name',
    relationship: 'Relationship',
    studentIds: 'Children',
    status: 'Status',
    email: 'Email',
    phone: 'Phone',
  } as const;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.parent();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: ParentRecord | null): void {
    this.form.reset({
      firstName: record?.firstName ?? '',
      lastName: record?.lastName ?? '',
      relationship: record?.relationship ?? '',
      studentIds: [...(record?.parentDetails?.studentPersonIds ?? [])],
      status: record?.status ?? Status.Active,
      email: record?.email ?? '',
      phone: record?.phone ?? '',
    });
  }

  private toRecord(): ParentRecord {
    const value = this.form.getRawValue();
    const existing = this.parent();

    return {
      ...existing,
      // Parents carry no external reference number, so a new one gets an id
      // from the name and the clock rather than a field the user has to invent.
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchIds: existing?.branchIds ?? [this.branchContext.selectedBranch()?.id ?? ''],
      type: PersonType.Parent,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      status: value.status,
      relationship: value.relationship,
      children: this.childOptions()
        .filter((choice) => value.studentIds.includes(choice.value))
        .map((choice) => choice.label),
      parentDetails: {
        ...existing?.parentDetails,
        studentPersonIds: value.studentIds,
      },
    };
  }
}
