import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 21-programs.md: relevant to universities/colleges/training centers; may be disabled otherwise. */
export interface Program extends BaseEntity {
  branchId: string;
  name: string;
  code?: string;
  description?: string;
  status: Status;
}
