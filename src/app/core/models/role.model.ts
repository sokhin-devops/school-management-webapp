import { BaseEntity } from './base.model';
import { DefaultRoleType, PermissionAction } from './enums';

/** One permission checkbox-tree entry, e.g. { module: 'students', actions: [View, Edit] }. */
export interface RolePermission {
  module: string;
  actions: PermissionAction[];
}

/**
 * 64-users-and-roles.md: default roles (Admin/Owner, Accounting, Teacher,
 * Parent, Student) are fixed and cannot be edited or deleted. Custom roles
 * pick permissions and assigned branches freely.
 */
export interface Role extends BaseEntity {
  name: string;
  isDefault: boolean;
  defaultType?: DefaultRoleType;
  permissions: RolePermission[];
  branchIds: string[];
}
