import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 41-fees.md: a configurable charge (tuition, registration, transportation, ...). */
export interface Fee extends BaseEntity {
  branchId: string;
  academicYearId?: string;
  name: string;
  category?: string;
  amount: number;
  description?: string;
  status: Status;
}
