import { BaseEntity } from './base.model';
import { Status } from './enums';

/**
 * 23-classes.md: a flexible academic grouping — do not hard-code "Grade".
 * `parentClassId` lets the same shape express "Grade 1 -> 1-A" (primary),
 * "Program -> Year 2 -> Section A" (university), or "Course -> Intermediate ->
 * Batch 03" (language center).
 */
export interface ClassGroup extends BaseEntity {
  branchId: string;
  academicYearId: string;
  name: string;
  code?: string;
  levelId?: string;
  programId?: string;
  parentClassId?: string;
  capacity?: number;
  status: Status;
}
