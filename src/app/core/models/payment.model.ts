import { BaseEntity } from './base.model';
import { PaymentMethod, PaymentStatus } from './enums';

/** 42-payments.md: a payment made against a configured Fee. */
export interface Payment extends BaseEntity {
  branchId: string;
  feeId: string;
  personId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  payerName?: string;
  reference?: string;
  notes?: string;
}
