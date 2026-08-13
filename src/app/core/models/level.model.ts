import { BaseEntity } from './base.model';
import { Status } from './enums';

/**
 * 22-levels.md: a configurable academic stage. `displayLabel` carries the
 * per-school terminology (Grade / Level / Year / ...) shown in the UI.
 */
export interface Level extends BaseEntity {
  branchId: string;
  programId?: string;
  name: string;
  displayLabel?: string;
  order?: number;
  status: Status;
}
