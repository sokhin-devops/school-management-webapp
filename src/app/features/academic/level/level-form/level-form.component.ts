import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { LevelRecord } from '../../../../core/services/level.service';
import { Status } from '../../../../core/models';

/** Create / edit a level. */
@Component({
  selector: 'app-level-form',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './level-form.component.html',
  host: { class: 'k-form-host' },
})
export class LevelFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly level = input<LevelRecord | null>(null);
  readonly programOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<LevelRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    displayLabel: ['Grade', Validators.required],
    programName: ['', Validators.required],
    order: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    status: [Status.Active, Validators.required],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly displayLabelOptions = ['Grade', 'Year', 'Level', 'Form'].map((value) => ({
    label: value,
    value,
  }));

  protected readonly programChoices = computed(() => [...this.programOptions()]);

  protected readonly isEdit = computed(() => this.level() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    displayLabel: 'Display label',
    programName: 'Programme',
    order: 'Order',
    status: 'Status',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.level();
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

  private reset(record: LevelRecord | null): void {
    this.form.reset({
      name: record?.name ?? '',
      displayLabel: record?.displayLabel ?? 'Grade',
      programName: record?.programName ?? '',
      order: record?.order ?? 1,
      status: record?.status ?? Status.Active,
    });
  }

  private toRecord(): LevelRecord {
    const value = this.form.getRawValue();
    const existing = this.level();

    return {
      ...existing,
      // A level carries no code of its own, so a new one is keyed by the clock
      // rather than by a field someone has to invent.
      id: existing?.id ?? `lvl-${Date.now().toString(36)}`,
      branchId: existing?.branchId ?? this.branchContext.selectedBranch().id,
      name: value.name.trim(),
      displayLabel: value.displayLabel,
      order: value.order,
      programName: value.programName,
      status: value.status,
    };
  }
}
