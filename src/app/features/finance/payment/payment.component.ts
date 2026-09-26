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
  RowActionsComponent,
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { humanize, money, readableDate } from '../../../share/data/format';
import { PaymentRecord, PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod, PaymentStatus } from '../../../core/models';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { FeeService } from '../../../core/services/fee.service';
import { StudentService } from '../../../core/services/student.service';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';

type Severity = 'success' | 'warn' | 'info' | 'danger' | 'secondary';

/** 42-payments.md — payments against configured fees. */
@Component({
  selector: 'app-payment',
  providers: [SaveState],
  imports: [CanDirective, 
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
    RowActionsComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  protected readonly paymentService = inject(PaymentService);
  private readonly studentService = inject(StudentService);
  private readonly feeService = inject(FeeService);

  protected readonly methodFilter = new RecordFilter<PaymentRecord, PaymentMethod>(
    (payment, value) => payment.method === value,
  );

  protected readonly statusFilter = new RecordFilter<PaymentRecord, PaymentStatus>(
    (payment, value) => payment.status === value,
  );

  /** The API stores studentId and feeId; the table shows both by name. */
  private readonly named = computed<PaymentRecord[]>(() => {
    const students = new Map(
      this.studentService.students().map((student) => [student.id, `${student.firstName} ${student.lastName}`]),
    );
    const fees = new Map(this.feeService.fees().map((fee) => [fee.id, fee.name]));

    return this.paymentService.payments().map((payment) => ({
      ...payment,
      studentName: students.get(payment.personId) ?? '',
      feeName: fees.get(payment.feeId) ?? '',
    }));
  });

  protected readonly records = createRecordList<PaymentRecord>({
    source: this.named,
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
      .map((student) => ({ label: `${student.firstName} ${student.lastName}`, value: student.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly feeOptions = computed(() =>
    this.feeService
      .fees()
      .map((fee) => ({ label: fee.name, value: fee.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

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
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.paymentService.save(payment), {
      success: 'Payment saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<PaymentRecord | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: PaymentRecord): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: PaymentRecord): RecordDetail {
    return {
      title: r.reference || 'Payment',
      subtitle: [r.studentName, r.feeName].filter(Boolean).join(' · '),
      badge: { label: humanize(r.status), severity: this.severity(r.status) },
      facts: [
        { label: 'Amount', value: money(r.amount) },
        { label: 'Paid on', value: readableDate(r.date) },
        { label: 'Method', value: humanize(r.method) },
        { label: 'Paid by', value: r.payerName },
        { label: 'Student', value: r.studentName },
        { label: 'Fee', value: r.feeName },
        { label: 'Notes', value: r.notes, wide: true },
      ],
    };
  }

  protected confirmRemove(record: PaymentRecord, name: string): void {
    this.removal.confirm({
      noun: 'payment',
      name,
      // Said because it is the thing a finance reader will check: deleting is
      // for an entry made by mistake. Money that came back is a refund.
      consequence: 'It will no longer count toward collected totals. To record money returned, edit it to Refunded instead.',
      remove: () => this.paymentService.remove(record.id),
    });
  }
}
