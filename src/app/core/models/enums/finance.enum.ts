/** 42-payments.md */
export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  BankTransfer = 'bank_transfer',
  MobileMoney = 'mobile_money',
  Cheque = 'cheque',
  Online = 'online',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Failed = 'failed',
  Refunded = 'refunded',
}

/** 43-expenses.md */
export enum ExpenseStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Paid = 'paid',
}
