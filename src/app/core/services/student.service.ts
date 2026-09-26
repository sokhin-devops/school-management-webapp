import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Person, PersonType, Status } from '../models';
import { ApiGender, ApiStudent, ApiStudentStatus } from '../api/api.models';
import { createTenantResource } from '../api/tenant-resource';
import { BranchContextService } from './branch-context.service';

/** Student row for the People > Students list, with the class name resolved by the page. */
export interface StudentRecord extends Person {
  className: string;
  classGroupId?: string;
  schoolId?: string;
  gender?: ApiGender;
  dateOfBirth?: string;
  admissionDate?: string;
}

/** The body POST and PUT /api/v1/students accept. */
interface StudentWrite {
  schoolId: string;
  branchId: string | null;
  classGroupId: string | null;
  studentCode: string;
  firstName: string;
  lastName: string;
  gender: ApiGender;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  admissionDate: string;
  status?: ApiStudentStatus;
}

/**
 * Students are keyed by school rather than by branch — they predate the
 * branch-scoped modules — so this loads the tenant's students rather than one
 * branch's, and the branch is written onto each record as it is saved.
 */
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly branchContext = inject(BranchContextService);
  private readonly resource = createTenantResource<ApiStudent, StudentWrite>('api/v1/students', {
    paged: true,
  });

  readonly students = computed(() => this.resource.items().map(toStudent));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  save(student: StudentRecord): Observable<ApiStudent> {
    const branch = this.branchContext.selectedBranch();
    const body = toWrite(student, branch?.schoolId ?? '', branch?.id ?? null);
    return student.id ? this.resource.update(student.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toStudent(student: ApiStudent): StudentRecord {
  return {
    id: student.id,
    // The screens model a person as belonging to several branches; the API keys
    // each record to one, and a student placed before this existed has none.
    branchIds: student.branchId ? [student.branchId] : [],
    type: PersonType.Student,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email ?? undefined,
    phone: student.phone ?? undefined,
    photoUrl: student.photoUrl ?? undefined,
    // Only ACTIVE reads as active: the screens offer two states and the API has
    // six, so graduated, transferred and the rest show as inactive rather than
    // being silently promoted to active.
    status: student.status === 'ACTIVE' ? Status.Active : Status.Inactive,
    schoolId: student.schoolId,
    classGroupId: student.classGroupId ?? undefined,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    admissionDate: student.admissionDate,
    // Resolved by the page from the classes it already has.
    className: '',
    studentDetails: {
      admissionNumber: student.studentCode,
      classId: student.classGroupId ?? undefined,
    },
  };
}

function toWrite(student: StudentRecord, schoolId: string, branchId: string | null): StudentWrite {
  return {
    schoolId: student.schoolId ?? schoolId,
    branchId,
    classGroupId: student.classGroupId ?? student.studentDetails?.classId ?? null,
    studentCode: student.studentDetails?.admissionNumber ?? '',
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender ?? 'OTHER',
    dateOfBirth: student.dateOfBirth ?? '2000-01-01',
    email: student.email ?? null,
    phone: student.phone ?? null,
    // The form asks for all three now. The fallbacks remain for records created
    // before it did, which would otherwise fail to save on their next edit.
    admissionDate: student.admissionDate ?? new Date().toISOString().slice(0, 10),
    status: student.status === Status.Inactive ? 'INACTIVE' : 'ACTIVE',
  };
}
