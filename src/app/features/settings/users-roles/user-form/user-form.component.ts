import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { UserRecord, UserService } from '../../../../core/services/user.service';
import { Status } from '../../../../core/models';

/** Create / edit a user. */
@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './user-form.component.html',
  host: { class: 'k-form-host' },
})
export class UserFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly userService = inject(UserService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly user = input<UserRecord | null>(null);
  readonly roleOptions = input<readonly { label: string; value: string }[]>([]);
  readonly branchOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<UserRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, (control: AbstractControl) => this.uniqueEmail(control)]],
    // Ids, not names: the invite and the update both carry the role and the
    // branches by id, and a slug of a name is not one.
    roleId: ['', Validators.required],
    status: [Status.Active, Validators.required],
    // Empty means every branch, as the API reads it.
    branchIds: [[] as string[]],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly roleChoices = computed(() => [...this.roleOptions()]);
  protected readonly branchChoices = computed(() => [...this.branchOptions()]);

  protected readonly isEdit = computed(() => this.user() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    fullName: 'Full name',
    email: 'Email',
    roleId: 'Role',
    status: 'Status',
    branchIds: 'Branches',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.user();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: UserRecord | null): void {
    this.form.reset({
      fullName: record?.fullName ?? '',
      email: record?.email ?? '',
      roleId: record?.roleId ?? '',
      status: record?.status ?? Status.Active,
      branchIds: [...(record?.branchIds ?? [])],
    });
  }

  private toRecord(): UserRecord {
    const value = this.form.getRawValue();
    const existing = this.user();
    const email = value.email.trim().toLowerCase();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      fullName: value.fullName.trim(),
      email,
      roleId: value.roleId,
      roleName: this.roleChoices().find((choice) => choice.value === value.roleId)?.label ?? '',
      branchIds: value.branchIds,
      branchNames: this.branchChoices()
        .filter((choice) => value.branchIds.includes(choice.value))
        .map((choice) => choice.label),
      status: value.status,
    };
  }

  /** An account is identified by its email, so two people cannot share one. */
  private uniqueEmail(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toLowerCase();
    if (!entered) {
      return null;
    }
    const editingId = this.user()?.id ?? null;
    const taken = this.userService
      .users()
      .some((other) => other.id !== editingId && other.email.toLowerCase() === entered);
    return taken ? { message: 'That email already belongs to another user.' } : null;
  }
}
