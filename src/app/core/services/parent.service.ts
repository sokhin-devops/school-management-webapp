import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Person, PersonType } from '../models';

/** A parent row, with the children's names resolved by the page. */
export interface ParentRecord extends Person {
  children: string[];
  relationship: string;
}
import { ApiParent } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/parents accept. */
interface ParentWrite {
  branchId?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  studentIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class ParentService {
  private readonly resource = createBranchResource<ApiParent, ParentWrite>('api/v1/parents');

  readonly parents = computed(() => this.resource.items().map(toParent));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: ParentRecord): Observable<ApiParent> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toParent(record: ApiParent): ParentRecord {
  return {
    id: record.id,
    branchIds: [record.branchId],
    type: PersonType.Parent,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone,
    status: toStatus(record.status),
    relationship: record.relationship,
    children: [],
    parentDetails: {
      studentPersonIds: record.studentIds ?? [],
    },
  };
}

function toWrite(record: ParentRecord): ParentWrite {
  return {
    firstName: record.firstName,
    lastName: record.lastName,
    relationship: record.relationship,
    email: record.email ?? '',
    phone: record.phone ?? '',
    studentIds: record.parentDetails?.studentPersonIds ?? [],
    status: fromStatus(record.status),
  };
}
