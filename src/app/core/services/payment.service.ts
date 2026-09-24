import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Payment, PaymentMethod, PaymentStatus } from '../models';

/** A payment with the names the list shows; the API sends ids only. */
export interface PaymentRecord extends Payment {
  studentName: string;
  feeName: string;
}
import { ApiPayment } from '../api/api.models';
import { ApiPaymentMethod, ApiPaymentStatus } from '../api/api.models';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/payments accept. */
interface PaymentWrite {
  branchId?: string;
  reference: string;
  feeId: string;
  studentId: string;
  amount: number;
  paidOn: string;
  method: ApiPaymentMethod;
  status: ApiPaymentStatus;
  payerName: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly resource = createBranchResource<ApiPayment, PaymentWrite>('api/v1/payments');

  readonly payments = computed(() => this.resource.items().map(toPayment));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: PaymentRecord): Observable<ApiPayment> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toPayment(record: ApiPayment): PaymentRecord {
  return {
    id: record.id,
    branchId: record.branchId,
    reference: record.reference,
    feeId: record.feeId,
    personId: record.studentId,
    amount: record.amount,
    date: record.paidOn,
    method: record.method.toLowerCase() as PaymentMethod,
    status: record.status.toLowerCase() as PaymentStatus,
    payerName: record.payerName ?? undefined,
    notes: record.notes ?? undefined,
    // Resolved by the page from the students and fees it already has.
    studentName: '',
    feeName: '',
  };
}

function toWrite(record: PaymentRecord): PaymentWrite {
  return {
    reference: record.reference ?? '',
    feeId: record.feeId,
    studentId: record.personId,
    amount: record.amount,
    paidOn: record.date,
    method: record.method.toUpperCase() as ApiPaymentMethod,
    status: record.status.toUpperCase() as ApiPaymentStatus,
    payerName: record.payerName ?? null,
    notes: record.notes ?? null,
  };
}
