import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Expense, ExpenseStatus } from '../models';
import { ApiExpense } from '../api/api.models';
import { ApiExpenseStatus } from '../api/api.models';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/expenses accept. */
interface ExpenseWrite {
  branchId?: string;
  description: string;
  category: string;
  amount: number;
  spentOn: string;
  status: ApiExpenseStatus;
  attachmentUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly resource = createBranchResource<ApiExpense, ExpenseWrite>('api/v1/expenses');

  readonly expenses = computed(() => this.resource.items().map(toExpense));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: Expense): Observable<ApiExpense> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toExpense(record: ApiExpense): Expense {
  return {
    id: record.id,
    branchId: record.branchId,
    description: record.description,
    category: record.category,
    amount: record.amount,
    date: record.spentOn,
    status: record.status.toLowerCase() as ExpenseStatus,
    attachmentUrl: record.attachmentUrl ?? undefined,
  };
}

function toWrite(record: Expense): ExpenseWrite {
  return {
    description: record.description ?? '',
    category: record.category,
    amount: record.amount,
    spentOn: record.date,
    status: record.status.toUpperCase() as ApiExpenseStatus,
    attachmentUrl: record.attachmentUrl ?? null,
  };
}
