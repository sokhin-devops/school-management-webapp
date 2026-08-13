import { BaseEntity } from './base.model';
import { Status } from './enums';

/**
 * 64-users-and-roles.md: a login account, distinct from a Person record. A
 * user may optionally link back to a Person (e.g. a Teacher who also logs in).
 */
export interface User extends BaseEntity {
  fullName: string;
  email: string;
  roleId: string;
  branchIds: string[];
  status: Status;
  personId?: string;
}
