import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ClassGroup } from '../models';

/** A class with the names the list shows resolved; the API sends ids only. */
export interface ClassGroupRecord extends ClassGroup {
  levelName: string;
  programName: string;
  academicYearName: string;
  /** The id is what is stored; the name beside it is for the table. */
  homeroomTeacherId?: string;
  teacherName: string;
  enrolled: number;
}
import { ApiClassGroup } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/classes accept. */
interface ClassGroupWrite {
  branchId?: string;
  academicYearId: string;
  programId: string | null;
  levelId: string | null;
  parentClassId: string | null;
  homeroomTeacherId: string | null;
  name: string;
  code: string;
  capacity: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class ClassGroupService {
  private readonly resource = createBranchResource<ApiClassGroup, ClassGroupWrite>('api/v1/classes');

  readonly classes = computed(() => this.resource.items().map(toClassGroup));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: ClassGroupRecord): Observable<ApiClassGroup> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toClassGroup(record: ApiClassGroup): ClassGroupRecord {
  return {
    id: record.id,
    branchId: record.branchId,
    academicYearId: record.academicYearId,
    programId: record.programId ?? undefined,
    levelId: record.levelId ?? undefined,
    parentClassId: record.parentClassId ?? undefined,
    name: record.name,
    code: record.code,
    capacity: record.capacity ?? undefined,
    status: toStatus(record.status),
    levelName: '',
    programName: '',
    academicYearName: '',
    homeroomTeacherId: record.homeroomTeacherId ?? undefined,
    teacherName: '',
    // Enrolment is a consequence of admissions; the API does not count it yet.
    enrolled: 0,
  };
}

function toWrite(record: ClassGroupRecord): ClassGroupWrite {
  return {
    academicYearId: record.academicYearId,
    programId: record.programId ?? null,
    levelId: record.levelId ?? null,
    parentClassId: record.parentClassId ?? null,
    homeroomTeacherId: record.homeroomTeacherId ?? null,
    name: record.name,
    code: record.code ?? '',
    capacity: record.capacity ?? null,
    status: fromStatus(record.status),
  };
}
