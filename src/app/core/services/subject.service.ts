import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from '../models';
import { ApiSubject } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/subjects accept. */
interface SubjectWrite {
  branchId?: string;
  name: string;
  code: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly resource = createBranchResource<ApiSubject, SubjectWrite>('api/v1/subjects');

  readonly subjects = computed(() => this.resource.items().map(toSubject));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: Subject): Observable<ApiSubject> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toSubject(record: ApiSubject): Subject {
  return {
    id: record.id,
    branchId: record.branchId,
    name: record.name,
    code: record.code,
    description: record.description ?? undefined,
    status: toStatus(record.status),
  };
}

function toWrite(record: Subject): SubjectWrite {
  return {
    name: record.name,
    code: record.code ?? '',
    description: record.description ?? null,
    status: fromStatus(record.status),
  };
}
