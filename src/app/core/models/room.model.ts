import { BaseEntity } from './base.model';
import { Status } from './enums';

/** 26-rooms.md: an independent resource — never a permanent child of a Class. */
export interface Room extends BaseEntity {
  branchId: string;
  name: string;
  code?: string;
  capacity?: number;
  status: Status;
}
