import { BaseEntity } from './base.model';
import { AcademicYearStatus } from './enums';

/** Optional term/semester nested under an Academic Year (25-academic-years.md). */
export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

/** 25-academic-years.md */
export interface AcademicYear extends BaseEntity {
  branchId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  terms?: Term[];
}
