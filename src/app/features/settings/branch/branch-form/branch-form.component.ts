import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { Branch, Status } from '../../../../core/models';

/** Create / edit a branch. */
@Component({
  selector: 'app-branch-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './branch-form.component.html',
  host: { class: 'k-form-host' },
})
export class BranchFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly branch = input<Branch | null>(null);

  readonly saved = output<Branch>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    status: [Status.Active, Validators.required],
    address: [''],
    phone: [''],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];


  protected readonly isEdit = computed(() => this.branch() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    status: 'Status',
    address: 'Address',
    phone: 'Phone',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.branch();
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

  private reset(record: Branch | null): void {
    this.form.reset({
      name: record?.name ?? '',
      status: record?.status ?? Status.Active,
      address: record?.address ?? '',
      phone: record?.phone ?? '',
    });
  }

  private toRecord(): Branch {
    const value = this.form.getRawValue();
    const existing = this.branch();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      schoolId: existing?.schoolId ?? this.branchContext.selectedBranch()?.schoolId ?? '',
      name: value.name.trim(),
      address: value.address.trim(),
      phone: value.phone.trim(),
      status: value.status,
    };
  }
}
