import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { RoomRecord, RoomService } from '../../../../core/services/room.service';
import { Status } from '../../../../core/models';

/** Create / edit a room. */
@Component({
  selector: 'app-room-form',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './room-form.component.html',
  host: { class: 'k-form-host' },
})
export class RoomFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly roomService = inject(RoomService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly room = input<RoomRecord | null>(null);
  readonly kindOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<RoomRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    code: ['', [Validators.required, (control: AbstractControl) => this.uniqueCode(control)]],
    building: ['', Validators.required],
    kind: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1), Validators.max(500)]],
    status: [Status.Active, Validators.required],
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly kindChoices = computed(() => [...this.kindOptions()]);

  protected readonly isEdit = computed(() => this.room() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    code: 'Code',
    building: 'Building',
    kind: 'Kind',
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
      const record = this.room();
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

  private reset(record: RoomRecord | null): void {
    this.form.reset({
      name: record?.name ?? '',
      code: record?.code ?? '',
      building: record?.building ?? '',
      kind: record?.kind ?? '',
      capacity: record?.capacity ?? 30,
      status: record?.status ?? Status.Active,
    });
  }

  private toRecord(): RoomRecord {
    const value = this.form.getRawValue();
    const existing = this.room();
    const code = value.code.trim().toUpperCase();

    return {
      ...existing,
      id: existing?.id ?? `rm-${code.toLowerCase()}`,
      branchId: existing?.branchId ?? this.branchContext.selectedBranch().id,
      name: value.name.trim(),
      code,
      building: value.building.trim(),
      kind: value.kind,
      capacity: value.capacity,
      status: value.status,
    };
  }

  /** The code is what timetables and reports refer to, so it has to be unique. */
  private uniqueCode(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toUpperCase();
    if (!entered) {
      return null;
    }
    const editingId = this.room()?.id ?? null;
    const taken = this.roomService
      .rooms()
      .some((other) => other.id !== editingId && (other.code ?? '').toUpperCase() === entered);
    return taken ? { message: 'That code already belongs to another room.' } : null;
  }
}
