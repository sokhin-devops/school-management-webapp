import { Injectable, signal } from '@angular/core';
import { Expense, ExpenseStatus } from '../models';

function expense(
  id: string,
  description: string,
  category: string,
  amount: number,
  date: string,
  status: ExpenseStatus,
): Expense {
  return { id, branchId: 'branch-1', description, category, amount, date, status };
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _expenses = signal<Expense[]>([
    expense('exp-01', 'Staff salaries — September', 'Payroll', 24800, '2026-09-01', ExpenseStatus.Paid),
    expense('exp-02', 'Electricity — August', 'Utilities', 1420, '2026-09-03', ExpenseStatus.Paid),
    expense('exp-03', 'Water — August', 'Utilities', 310, '2026-09-03', ExpenseStatus.Paid),
    expense('exp-04', 'Science lab consumables', 'Supplies', 860, '2026-09-05', ExpenseStatus.Approved),
    expense('exp-05', 'Library book order', 'Supplies', 1240, '2026-09-07', ExpenseStatus.Approved),
    expense('exp-06', 'Bus fuel and servicing', 'Transport', 1980, '2026-09-08', ExpenseStatus.Paid),
    expense('exp-07', 'Roof repair — Science Wing', 'Maintenance', 3400, '2026-09-10', ExpenseStatus.Pending),
    expense('exp-08', 'Projector replacement ×4', 'Equipment', 2240, '2026-09-11', ExpenseStatus.Approved),
    expense('exp-09', 'Cleaning contract — Q3', 'Facilities', 1650, '2026-09-12', ExpenseStatus.Paid),
    expense('exp-10', 'Internet and phone', 'Utilities', 480, '2026-09-12', ExpenseStatus.Paid),
    expense('exp-11', 'Sports equipment', 'Equipment', 720, '2026-09-14', ExpenseStatus.Rejected),
    expense('exp-12', 'Teacher training workshop', 'Professional development', 1100, '2026-09-15', ExpenseStatus.Approved),
    expense('exp-13', 'Printer toner and stationery', 'Supplies', 390, '2026-09-16', ExpenseStatus.Paid),
    expense('exp-14', 'Security services — September', 'Facilities', 1500, '2026-09-16', ExpenseStatus.Pending),
    expense('exp-15', 'Software licences', 'Technology', 2100, '2026-09-17', ExpenseStatus.Approved),
    expense('exp-16', 'Playground resurfacing', 'Maintenance', 5600, '2026-09-18', ExpenseStatus.Pending),
  ]);

  readonly expenses = this._expenses.asReadonly();
}
