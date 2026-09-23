import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { humanize, money } from '../../../share/data/format';
import { PaymentRecord, PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod, PaymentStatus } from '../../../core/models';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { FeeService } from '../../../core/services/fee.service';
import { StudentService } from '../../../core/services/student.service';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';

type Severity = 'success' | 'warn' | 'info' | 'danger' | 'secondary';

/** 42-payments.md — payments against configured fees. */
@Component({
  selector: 'app-payment',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    PaymentFormComponent,
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  private readonly paymentService = inject(PaymentService);
  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);

  protected readonly methodFilter = new RecordFilter<PaymentRecord, PaymentMethod>(
    (payment, value) => payment.method === value,
  );

  protected readonly statusFilter = new RecordFilter<PaymentRecord, PaymentStatus>(
    (payment, value) => payment.status === value,
  );

  protected readonly records = createRecordList<PaymentRecord>({
    source: this.paymentService.payments,
    searchKeys: [
      (payment) => payment.reference,
      (payment) => payment.studentName,
      (payment) => payment.feeName,
    ],
    sortKeys: {
      reference: (payment) => payment.reference ?? '',
      studentName: (payment) => payment.studentName,
      amount: (payment) => payment.amount,
      date: (payment) => payment.date,
      status: (payment) => payment.status,
    },
    // Most recent first — a payments list is read from the newest entry down.
    defaultSortField: 'date',
    filters: [this.methodFilter, this.statusFilter] as never[],
    noun: { one: 'payment', many: 'payments' },
  });

  protected readonly methodOptions = Object.values(PaymentMethod).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly statusOptions = Object.values(PaymentStatus).map((value) => ({
    label: humanize(value),
    value,
  }));

  protected readonly money = money;
  protected readonly humanize = humanize;

  constructor() {
    openOnQuickAdd('payment', () => this.openCreate());
    this.records.sortOrder.set(-1);
  }

  protected severity(status: PaymentStatus): Severity {
    switch (status) {
      case PaymentStatus.Paid:
        return 'success';
      case PaymentStatus.Pending:
        return 'warn';
      case PaymentStatus.PartiallyPaid:
        return 'info';
      case PaymentStatus.Failed:
        return 'danger';
      default:
        return 'secondary';
    }
  }
  /** A payment is booked against a real student and a real fee. */
  protected readonly studentOptions = computed(() =>
    this.studentService
      .students()
      .map((student) => ({
        label: `${student.firstName} ${student.lastName}`,
        value: `${student.firstName} ${student.lastName}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly feeOptions = computed(() =>
    this.feeService
      .fees()
      .map((fee) => ({ label: fee.name, value: fee.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<PaymentRecord | null>(null);

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(payment: PaymentRecord): void {
    this.editing.set(payment);
    this.formVisible.set(true);
  }

  protected onSaved(payment: PaymentRecord): void {
    this.paymentService.upsert(payment);
  }
}
