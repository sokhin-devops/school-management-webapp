import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 62-branches.md */
export interface Branch extends BaseEntity {
  schoolId: string;
  name: string;
  address?: string;
  phone?: string;
  status: Status;
}
