import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { AcademicYear, AcademicYearStatus } from '../../../../core/models';
import { isoDate } from '../../../../share/data/format';

/** Create / edit an academic year. */
@Component({
  selector: 'app-academic-year-form',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './academic-year-form.component.html',
  host: { class: 'k-form-host' },
})
export class AcademicYearFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly year = input<AcademicYear | null>(null);

  readonly saved = output<AcademicYear>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(20)]],
    status: [AcademicYearStatus.Upcoming, Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, [Validators.required, (control: AbstractControl) => this.afterStart(control)]],
  });

  protected readonly statusOptions = [
    { label: 'Upcoming', value: AcademicYearStatus.Upcoming },
    { label: 'Active', value: AcademicYearStatus.Active },
    { label: 'Completed', value: AcademicYearStatus.Completed },
  ];


  protected readonly isEdit = computed(() => this.year() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    status: 'Status',
    startDate: 'Start date',
    endDate: 'End date',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.year();
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

  private reset(record: AcademicYear | null): void {
    this.form.reset({
      name: record?.name ?? '',
      status: record?.status ?? AcademicYearStatus.Upcoming,
      startDate: record?.startDate ? new Date(record.startDate) : null,
      endDate: record?.endDate ? new Date(record.endDate) : null,
    });
  }

  private toRecord(): AcademicYear {
    const value = this.form.getRawValue();
    const existing = this.year();

    return {
      ...existing,
      id: existing?.id ?? `ay-${value.name.trim().slice(0, 4)}`,
      branchId: existing?.branchId ?? this.branchContext.selectedBranch().id,
      name: value.name.trim(),
      startDate: isoDate(value.startDate),
      endDate: isoDate(value.endDate),
      status: value.status,
      // Terms are managed on the year's own page, so an edit here leaves them be.
      terms: existing?.terms ?? [],
    };
  }

  /** A year that ends before it starts would break every date range built from it. */
  private afterStart(control: AbstractControl): ValidationErrors | null {
    const start = this.form?.controls.startDate.value;
    const end = control.value as Date | null;
    if (!start || !end) {
      return null;
    }
    return end > start ? null : { message: 'End date must come after the start date.' };
  }
}
