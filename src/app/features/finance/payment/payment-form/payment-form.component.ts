import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { PaymentRecord, PaymentService } from '../../../../core/services/payment.service';
import { PaymentMethod, PaymentStatus } from '../../../../core/models';
import { humanize, isoDate } from '../../../../share/data/format';
import { FeeService } from '../../../../core/services/fee.service';
import { SchoolService } from '../../../../core/services/school.service';

/** Create / edit a payment. */
@Component({
  selector: 'app-payment-form',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './payment-form.component.html',
  host: { class: 'k-form-host' },
})
export class PaymentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly paymentService = inject(PaymentService);
  private readonly branchContext = inject(BranchContextService);
  private readonly fees = inject(FeeService);
  private readonly school = inject(SchoolService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly payment = input<PaymentRecord | null>(null);
  readonly studentOptions = input<readonly { label: string; value: string }[]>([]);
  readonly feeOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<PaymentRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    reference: ['', [Validators.required, (control: AbstractControl) => this.uniqueReference(control)]],
    // Chosen by id: a payment is booked against the student and fee records
    // themselves, not against their names.
    studentId: ['', Validators.required],
    feeId: ['', Validators.required],
    payerName: ['', Validators.maxLength(150)],
    amount: [0, [Validators.required, Validators.min(1)]],
    date: [null as Date | null, Validators.required],
    method: [PaymentMethod.Cash, Validators.required],
    status: [PaymentStatus.Paid, Validators.required],
    notes: ['', Validators.maxLength(200)],
  });

  protected readonly methodOptions = Object.values(PaymentMethod).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly statusOptions = Object.values(PaymentStatus).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly studentChoices = computed(() => [...this.studentOptions()]);
  protected readonly feeChoices = computed(() => [...this.feeOptions()]);

  protected readonly isEdit = computed(() => this.payment() !== null);

  /** Amounts are entered in the school's currency (61-school-settings.md). */
  protected readonly currency = computed(() => this.school.school()?.currency ?? 'USD');

  /**
   * Choosing a fee fills in what it charges, which is what most payments are.
   * Only an empty amount is filled: an instalment someone has typed stays.
   */
  protected onFeeChosen(feeId: string): void {
    const fee = this.fees.fees().find((candidate) => candidate.id === feeId);
    if (fee && !this.form.controls.amount.value) {
      this.form.controls.amount.setValue(fee.amount);
    }
  }
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    reference: 'Reference',
    studentId: 'Student',
    feeId: 'Fee',
    payerName: 'Paid by',
    amount: 'Amount',
    date: 'Date',
    method: 'Method',
    status: 'Status',
    notes: 'Notes',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.payment();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: PaymentRecord | null): void {
    this.form.reset({
      reference: record?.reference ?? '',
      studentId: record?.personId ?? '',
      feeId: record?.feeId ?? '',
      payerName: record?.payerName ?? '',
      amount: record?.amount ?? 0,
      date: record?.date ? new Date(record.date) : new Date(),
      method: record?.method ?? PaymentMethod.Cash,
      status: record?.status ?? PaymentStatus.Paid,
      notes: record?.notes ?? '',
    });
  }

  private toRecord(): PaymentRecord {
    const value = this.form.getRawValue();
    const existing = this.payment();
    const reference = value.reference.trim().toUpperCase();
    const label = (choices: readonly { label: string; value: string }[], id: string) =>
      choices.find((choice) => choice.value === id)?.label ?? '';

    return {
      ...existing,
      id: existing?.id ?? '',
      branchId: existing?.branchId ?? this.branchContext.selectedBranch()?.id ?? '',
      feeId: value.feeId,
      personId: value.studentId,
      reference,
      studentName: label(this.studentChoices(), value.studentId),
      feeName: label(this.feeChoices(), value.feeId),
      payerName: value.payerName.trim() || undefined,
      amount: value.amount,
      date: isoDate(value.date),
      method: value.method,
      status: value.status,
      notes: value.notes.trim(),
    };
  }


  /** The reference is what a receipt is looked up by, so it cannot repeat. */
  private uniqueReference(control: AbstractControl): ValidationErrors | null {
    const entered = String(control.value ?? '').trim().toUpperCase();
    if (!entered) {
      return null;
    }
    const editingId = this.payment()?.id ?? null;
    const taken = this.paymentService
      .payments()
      .some((other) => other.id !== editingId && (other.reference ?? '').toUpperCase() === entered);
    return taken ? { message: 'That reference already belongs to another payment.' } : null;
  }
}
