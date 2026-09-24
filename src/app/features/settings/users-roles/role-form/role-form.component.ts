import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { RoleRecord } from '../../../../core/services/role.service';
import { PermissionAction } from '../../../../core/models';
import { humanize } from '../../../../share/data/format';

/** The actions a custom role is granted on each module it can reach. */
const ALL_ACTIONS = [
  PermissionAction.View,
  PermissionAction.Create,
  PermissionAction.Edit,
  PermissionAction.Delete,
];

/** Create / edit a role. */
@Component({
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './role-form.component.html',
  host: { class: 'k-form-host' },
})
export class RoleFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly role = input<RoleRecord | null>(null);
  readonly branchOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<RoleRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    modules: [[] as string[], Validators.required],
    branchNames: [[] as string[], Validators.required],
  });

  protected readonly moduleOptions = [
    'students',
    'teachers',
    'parents',
    'academic',
    'attendance',
    'finance',
    'reports',
    'settings',
  ].map((value) => ({ label: humanize(value), value }));

  protected readonly branchChoices = computed(() => [...this.branchOptions()]);

  protected readonly isEdit = computed(() => this.role() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    modules: 'Modules',
    branchNames: 'Branches',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.role();
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

  private reset(record: RoleRecord | null): void {
    this.form.reset({
      name: record?.name ?? '',
      modules: (record?.permissions ?? []).map((permission: { module: string }) => permission.module),
      branchNames: [...(record?.branchNames ?? [])],
    });
  }

  private toRecord(): RoleRecord {
    const value = this.form.getRawValue();
    const existing = this.role();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      name: value.name.trim(),
      // Only the five seeded roles are default; anything made here is custom.
      isDefault: existing?.isDefault ?? false,
      permissions: value.modules.map((module) => ({ module, actions: [...ALL_ACTIONS] })),
      branchIds: value.branchNames.map((name) => name.toLowerCase().replace(/\s+/g, '-')),
      branchNames: value.branchNames,
    };
  }
}
