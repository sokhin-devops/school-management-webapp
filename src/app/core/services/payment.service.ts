import { Injectable, signal } from '@angular/core';
import { Payment, PaymentMethod, PaymentStatus } from '../models';

/** Payment row for Finance > Payments, denormalized with display-ready names. */
export interface PaymentRecord extends Payment {
  studentName: string;
  feeName: string;
}

function payment(
  reference: string,
  studentName: string,
  feeName: string,
  amount: number,
  date: string,
  method: PaymentMethod,
  status: PaymentStatus,
): PaymentRecord {
  return {
    id: reference.toLowerCase(),
    branchId: 'branch-1',
    feeId: 'fee-01',
    personId: studentName.toLowerCase().replace(/\s+/g, '-'),
    reference,
    studentName,
    feeName,
    payerName: studentName,
    amount,
    date,
    method,
    status,
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly _payments = signal<PaymentRecord[]>([
    payment('PAY-2026-0001', 'Aiden Carter', 'Tuition — Primary', 1200, '2026-09-02', PaymentMethod.BankTransfer, PaymentStatus.Paid),
    payment('PAY-2026-0002', 'Sophia Nguyen', 'Tuition — Primary', 600, '2026-09-03', PaymentMethod.Card, PaymentStatus.PartiallyPaid),
    payment('PAY-2026-0003', 'Liam Johnson', 'Tuition — Primary', 1200, '2026-09-04', PaymentMethod.Cash, PaymentStatus.Paid),
    payment('PAY-2026-0004', 'Olivia Martinez', 'Registration', 150, '2026-09-05', PaymentMethod.MobileMoney, PaymentStatus.Paid),
    payment('PAY-2026-0005', 'Noah Williams', 'Transportation — Zone A', 300, '2026-09-08', PaymentMethod.Card, PaymentStatus.Pending),
    payment('PAY-2026-0006', 'Emma Brown', 'Tuition — Primary', 1200, '2026-09-09', PaymentMethod.BankTransfer, PaymentStatus.Paid),
    payment('PAY-2026-0007', 'Elijah Davis', 'Textbooks', 180, '2026-09-10', PaymentMethod.Cash, PaymentStatus.Paid),
    payment('PAY-2026-0008', 'Ava Garcia', 'Laboratory', 120, '2026-09-11', PaymentMethod.Online, PaymentStatus.Failed),
    payment('PAY-2026-0009', 'Lucas Rodriguez', 'Tuition — Primary', 1200, '2026-09-12', PaymentMethod.Cheque, PaymentStatus.Pending),
    payment('PAY-2026-0010', 'Mia Hernandez', 'Sports & Activities', 110, '2026-09-14', PaymentMethod.Card, PaymentStatus.Paid),
    payment('PAY-2026-0011', 'Mason Lopez', 'Tuition — Secondary', 800, '2026-09-15', PaymentMethod.BankTransfer, PaymentStatus.PartiallyPaid),
    payment('PAY-2026-0012', 'Isabella Gonzalez', 'Uniform', 90, '2026-09-15', PaymentMethod.Cash, PaymentStatus.Paid),
    payment('PAY-2026-0013', 'Ethan Wilson', 'Tuition — Secondary', 1600, '2026-09-16', PaymentMethod.Online, PaymentStatus.Paid),
    payment('PAY-2026-0014', 'Amelia Anderson', 'Field Trips', 140, '2026-09-17', PaymentMethod.MobileMoney, PaymentStatus.Refunded),
    payment('PAY-2026-0015', 'Logan Thomas', 'Examination', 60, '2026-09-17', PaymentMethod.Cash, PaymentStatus.Paid),
    payment('PAY-2026-0016', 'Charlotte Taylor', 'Tuition — Secondary', 1600, '2026-09-18', PaymentMethod.BankTransfer, PaymentStatus.Pending),
  ]);

  readonly payments = this._payments.asReadonly();
}
