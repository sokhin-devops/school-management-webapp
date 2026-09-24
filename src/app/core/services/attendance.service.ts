import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiAttendanceStatus } from '../api/api.models';
import { describeFailure } from '../api/api-failure';
import { ApiClientService } from './api-client.service';
import { BranchContextService } from './branch-context.service';

export type AttendanceMark = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceMark;
  note?: string;
}

export interface AttendanceRegister {
  classGroupId: string;
  date: string;
  session: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  entries: AttendanceEntry[];
}

interface ApiRegisterResponse {
  branchId: string;
  classGroupId: string;
  attendanceDate: string;
  session: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  entries: { studentId: string; status: ApiAttendanceStatus; note: string | null }[];
}

/**
 * Attendance is taken a class at a time, so this works in registers rather than
 * in rows: one call reads the sitting, one call replaces it.
 *
 * A register is not cached. Every combination of class, date and session is a
 * different sheet, and holding the last one would show yesterday's marks under
 * today's date for as long as it took the new one to arrive.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiClientService);
  private readonly branchContext = inject(BranchContextService);

  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  loadRegister(classGroupId: string, date: string, session: string): Observable<AttendanceRegister> {
    this._loading.set(true);
    this._error.set(null);

    return this.api
      .get<ApiRegisterResponse>('api/v1/attendance/register', {
        branchId: this.branchContext.selectedBranch()?.id ?? '',
        classGroupId,
        attendanceDate: date,
        session,
      })
      .pipe(
        tap({
          next: () => this._loading.set(false),
          error: (failure: unknown) => {
            this._error.set(describeFailure(failure));
            this._loading.set(false);
          },
        }),
        map(toRegister),
      );
  }

  saveRegister(
    classGroupId: string,
    date: string,
    session: string,
    entries: AttendanceEntry[],
  ): Observable<AttendanceRegister> {
    this._saving.set(true);
    this._error.set(null);

    return this.api
      .put<ApiRegisterResponse>('api/v1/attendance/register', {
        branchId: this.branchContext.selectedBranch()?.id ?? '',
        classGroupId,
        attendanceDate: date,
        session,
        entries: entries.map((entry) => ({
          studentId: entry.studentId,
          status: entry.status.toUpperCase() as ApiAttendanceStatus,
          note: entry.note || null,
        })),
      })
      .pipe(
        tap({
          next: () => this._saving.set(false),
          error: (failure: unknown) => {
            this._error.set(describeFailure(failure));
            this._saving.set(false);
          },
        }),
        map(toRegister),
      );
  }
}

/** One conversion, used by both calls, because the server answers both the same way. */
function toRegister(register: ApiRegisterResponse): AttendanceRegister {
  return {
    classGroupId: register.classGroupId,
    date: register.attendanceDate,
    session: register.session,
    present: register.present,
    absent: register.absent,
    late: register.late,
    excused: register.excused,
    entries: (register.entries ?? []).map((entry) => ({
      studentId: entry.studentId,
      status: entry.status.toLowerCase() as AttendanceMark,
      note: entry.note ?? undefined,
    })),
  };
}
