import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Person, PersonType } from '../models';

/** A teacher row, with the subject names the list shows resolved by the page. */
export interface TeacherRecord extends Person {
  subjects: string[];
  department: string;
}
import { ApiTeacher } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/teachers accept. */
interface TeacherWrite {
  branchId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  subjectIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly resource = createBranchResource<ApiTeacher, TeacherWrite>('api/v1/teachers');

  readonly teachers = computed(() => this.resource.items().map(toTeacher));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: TeacherRecord): Observable<ApiTeacher> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toTeacher(record: ApiTeacher): TeacherRecord {
  return {
    id: record.id,
    // The screens model a person as belonging to several branches; the API keys
    // each record to one. The list of one is the honest translation.
    branchIds: [record.branchId],
    type: PersonType.Teacher,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone ?? undefined,
    status: toStatus(record.status),
    department: record.department,
    subjects: [],
    teacherDetails: {
      employeeNumber: record.employeeNumber,
      subjectIds: record.subjectIds ?? [],
    },
  };
}

function toWrite(record: TeacherRecord): TeacherWrite {
  return {
    employeeNumber: record.teacherDetails?.employeeNumber ?? '',
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email ?? '',
    phone: record.phone ?? null,
    department: record.department,
    subjectIds: record.teacherDetails?.subjectIds ?? [],
    status: fromStatus(record.status),
  };
}
