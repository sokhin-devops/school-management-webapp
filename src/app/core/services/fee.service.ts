import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Fee } from '../models';
import { ApiFee } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/fees accept. */
interface FeeWrite {
  branchId?: string;
  academicYearId: string | null;
  name: string;
  category: string;
  amount: number;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly resource = createBranchResource<ApiFee, FeeWrite>('api/v1/fees');

  readonly fees = computed(() => this.resource.items().map(toFee));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: Fee): Observable<ApiFee> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toFee(record: ApiFee): Fee {
  return {
    id: record.id,
    branchId: record.branchId,
    academicYearId: record.academicYearId ?? undefined,
    name: record.name,
    category: record.category,
    amount: record.amount,
    description: record.description ?? undefined,
    status: toStatus(record.status),
  };
}

function toWrite(record: Fee): FeeWrite {
  return {
    academicYearId: record.academicYearId ?? null,
    name: record.name,
    category: record.category ?? '',
    amount: record.amount,
    description: record.description ?? null,
    status: fromStatus(record.status),
  };
}
