import { BaseEntity } from './base.model';
import { AcademicYearStatus } from './enums';

/** Optional term/semester nested under an Academic Year (25-academic-years.md). */
export interface Term {
  /** Local only - the API keeps a year's terms as an ordered list, not as records. */
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

/** 25-academic-years.md */
export interface AcademicYear extends BaseEntity {
  branchId: string;
  /** The school the year belongs to; the API requires it on every write. */
  schoolId?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  terms?: Term[];
}
