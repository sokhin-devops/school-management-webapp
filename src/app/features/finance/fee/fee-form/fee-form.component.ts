import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { AcademicYearStatus, Fee, Status } from '../../../../core/models';
import { AcademicYearService } from '../../../../core/services/academic-year.service';
import { SchoolService } from '../../../../core/services/school.service';
import { FEE_CATEGORIES, categoryChoices } from '../../../../share/data/categories';

/** Create / edit a fee. */
@Component({
  selector: 'app-fee-form',
  imports: [
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './fee-form.component.html',
  host: { class: 'k-form-host' },
})
export class FeeFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);
  private readonly years = inject(AcademicYearService);
  private readonly school = inject(SchoolService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly fee = input<Fee | null>(null);
  readonly categoryOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<Fee>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    category: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    status: [Status.Active, Validators.required],
    description: ['', Validators.maxLength(200)],
    academicYearId: [''],
  });

  /** Amounts are entered in the school's currency (61-school-settings.md). */
  protected readonly currency = computed(() => this.school.school()?.currency ?? 'USD');

  /** Real years, by id; a fee can also run across years, so none is allowed. */
  protected readonly yearChoices = computed(() =>
    this.years.years().map((year) => ({
      label: year.status === AcademicYearStatus.Active ? `${year.name} (current)` : year.name,
      value: year.id,
    })),
  );

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly categoryChoices = computed(() => categoryChoices(FEE_CATEGORIES, this.categoryOptions()));

  protected readonly isEdit = computed(() => this.fee() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    category: 'Category',
    amount: 'Amount',
    status: 'Status',
    description: 'Description',
    academicYearId: 'Academic year',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.fee();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: Fee | null): void {
    this.form.reset({
      academicYearId: record?.academicYearId ?? this.years.years().find((year) => year.status === AcademicYearStatus.Active)?.id ?? '',
      name: record?.name ?? '',
      category: record?.category ?? '',
      amount: record?.amount ?? 0,
      status: record?.status ?? Status.Active,
      description: record?.description ?? '',
    });
  }

  private toRecord(): Fee {
    const value = this.form.getRawValue();
    const existing = this.fee();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      // A real year, or none. The invented 'ay-2026' this used to send is not an
      // id the server could ever accept.
      academicYearId: value.academicYearId || undefined,
      name: value.name.trim(),
      category: value.category,
      amount: value.amount,
      description: value.description.trim(),
      status: value.status,
    };
  }
}
