import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { SubjectService } from '../../../../core/services/subject.service';
import { Status, Subject } from '../../../../core/models';

/** Create / edit a subject. */
@Component({
  selector: 'app-subject-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './subject-form.component.html',
  host: { class: 'k-form-host' },
})
export class SubjectFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly subjectService = inject(SubjectService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly subject = input<Subject | null>(null);

  readonly saved = output<Subject>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    code: ['', [Validators.required, (control: AbstractControl) => this.uniqueCode(control)]],
    description: ['', Validators.maxLength(200)],
    status: [Status.Active, Validators.required],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];


  protected readonly isEdit = computed(() => this.subject() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    code: 'Code',
    description: 'Description',
    status: 'Status',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.subject();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: Subject | null): void {
    this.form.reset({
      name: record?.name ?? '',
      code: record?.code ?? '',
      description: record?.description ?? '',
      status: record?.status ?? Status.Active,
    });
  }

  private toRecord(): Subject {
    const value = this.form.getRawValue();
    const existing = this.subject();
    const code = value.code.trim().toUpperCase();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      name: value.name.trim(),
      code,
      description: value.description.trim(),
      status: value.status,
    };
  }

  /** The code is what timetables and reports refer to, so it has to be unique. */
  private uniqueCode(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toUpperCase();
    if (!entered) {
      return null;
    }
    const editingId = this.subject()?.id ?? null;
    const taken = this.subjectService
      .subjects()
      .some((other) => other.id !== editingId && (other.code ?? '').toUpperCase() === entered);
    return taken ? { message: 'That code already belongs to another subject.' } : null;
  }
}
