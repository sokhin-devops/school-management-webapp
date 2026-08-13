/**
 * 64-users-and-roles.md: default roles. These are fixed — cannot be edited or
 * deleted, and "Branch Admin" is deliberately not one of them.
 */
export enum DefaultRoleType {
  Owner = 'owner',
  Accounting = 'accounting',
  Teacher = 'teacher',
  Parent = 'parent',
  Student = 'student',
}

/** Permission checkbox-tree actions (64-users-and-roles.md). */
export enum PermissionAction {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Delete = 'delete',
}
