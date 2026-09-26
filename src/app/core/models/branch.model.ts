import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 62-branches.md */
export interface Branch extends BaseEntity {
  schoolId: string;
  name: string;
  address?: string;
  phone?: string;
  /** The school's head branch. Carried so an edit sends it back unchanged —
   * the API reads a missing flag as "not the main branch any more". */
  mainBranch?: boolean;
  status: Status;
}
