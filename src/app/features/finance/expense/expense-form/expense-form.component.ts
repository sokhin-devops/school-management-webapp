import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { Expense, ExpenseStatus } from '../../../../core/models';
import { humanize, isoDate } from '../../../../share/data/format';

/** Create / edit an expense. */
@Component({
  selector: 'app-expense-form',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './expense-form.component.html',
  host: { class: 'k-form-host' },
})
export class ExpenseFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly expense = input<Expense | null>(null);
  readonly categoryOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<Expense>();

  protected readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    date: [null as Date | null, Validators.required],
    status: [ExpenseStatus.Pending, Validators.required],
  });

  protected readonly statusOptions = Object.values(ExpenseStatus).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly categoryChoices = computed(() => [...this.categoryOptions()]);

  protected readonly isEdit = computed(() => this.expense() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    description: 'Description',
    category: 'Category',
    amount: 'Amount',
    date: 'Date',
    status: 'Status',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.expense();
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

  private reset(record: Expense | null): void {
    this.form.reset({
      description: record?.description ?? '',
      category: record?.category ?? '',
      amount: record?.amount ?? 0,
      date: record?.date ? new Date(record.date) : new Date(),
      status: record?.status ?? ExpenseStatus.Pending,
    });
  }

  private toRecord(): Expense {
    const value = this.form.getRawValue();
    const existing = this.expense();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      description: value.description.trim(),
      category: value.category,
      amount: value.amount,
      date: isoDate(value.date),
      status: value.status,
    };
  }
}
