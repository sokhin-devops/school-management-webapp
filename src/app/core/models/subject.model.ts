import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 24-subjects.md: a configurable academic offering (Mathematics, Programming, Speaking, ...). */
export interface Subject extends BaseEntity {
  branchId: string;
  name: string;
  code?: string;
  description?: string;
  status: Status;
}
