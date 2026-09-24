import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { AcademicYear, AcademicYearStatus } from '../models';
import { ApiAcademicYear } from '../api/api.models';
import { createTenantResource } from '../api/tenant-resource';

/** The body POST and PUT /api/v1/academic-years accept. */
interface AcademicYearWrite {
  name: string;
  startDate: string;
  endDate: string;
  current?: boolean;
}

/**
 * Academic years belong to the school rather than to a branch, so they are the
 * same list whichever branch is selected.
 */
@Injectable({ providedIn: 'root' })
export class AcademicYearService {
  private readonly resource = createTenantResource<ApiAcademicYear, AcademicYearWrite>(
    'api/v1/academic-years',
  );

  readonly years = computed(() => this.resource.items().map(toAcademicYear));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  save(year: AcademicYear): Observable<ApiAcademicYear> {
    const body = toWrite(year);
    return year.id ? this.resource.update(year.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toAcademicYear(year: ApiAcademicYear): AcademicYear {
  return {
    id: year.id,
    branchId: year.schoolId,
    name: year.name,
    startDate: year.startDate,
    endDate: year.endDate,
    status: statusOf(year),
    terms: [],
  };
}

/**
 * The API records which year is current; the screens show three states. The
 * other two are read off the dates rather than stored, so a year cannot be
 * marked completed while it is still running.
 */
function statusOf(year: ApiAcademicYear): AcademicYearStatus {
  if (year.current) {
    return AcademicYearStatus.Active;
  }
  const today = new Date().toISOString().slice(0, 10);
  return year.endDate < today ? AcademicYearStatus.Completed : AcademicYearStatus.Upcoming;
}

function toWrite(year: AcademicYear): AcademicYearWrite {
  return {
    name: year.name,
    startDate: year.startDate,
    endDate: year.endDate,
    // Only Active means current; Upcoming and Completed are both "not current"
    // and the dates already say which.
    current: year.status === AcademicYearStatus.Active,
  };
}
