import { BaseEntity } from './base.model';
import { ExpenseStatus } from './enums';

/** 43-expenses.md: a school/branch expense. */
export interface Expense extends BaseEntity {
  branchId: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  description?: string;
  attachmentUrl?: string;
}
