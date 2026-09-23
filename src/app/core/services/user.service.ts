import { Injectable, signal } from '@angular/core';
import { DefaultRoleType, PermissionAction, Role, Status, User } from '../models';
import { removeById, upsertById } from '../utils/collection';

/** User row for Settings > Users & Roles, denormalized with its role name and branch names. */
export interface UserRecord extends User {
  roleName: string;
  branchNames: string[];
}

function user(
  id: string,
  fullName: string,
  email: string,
  roleName: string,
  branchNames: string[],
  status = Status.Active,
): UserRecord {
  return {
    id,
    fullName,
    email,
    roleId: roleName.toLowerCase().replace(/\s+/g, '-'),
    roleName,
    branchIds: branchNames.map((name) => name.toLowerCase().replace(/\s+/g, '-')),
    branchNames,
    status,
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _users = signal<UserRecord[]>([
    user('usr-01', 'Sophea Chan', 'sophea.chan@riverside.edu', 'Admin / Owner', ['Main Branch', 'Riverside North', 'Riverside East', 'Language Centre', 'Siem Reap Campus']),
    user('usr-02', 'Dara Kim', 'dara.kim@riverside.edu', 'Accounting', ['Main Branch', 'Riverside North']),
    user('usr-03', 'Mealea Sok', 'mealea.sok@riverside.edu', 'Accounting', ['Language Centre']),
    user('usr-04', 'Rachel Owusu', 'rachel.owusu@riverside.edu', 'Teacher', ['Main Branch']),
    user('usr-05', 'Daniel Ferreira', 'daniel.ferreira@riverside.edu', 'Teacher', ['Main Branch', 'Riverside East']),
    user('usr-06', 'Priya Raman', 'priya.raman@riverside.edu', 'Teacher', ['Language Centre']),
    user('usr-07', 'Amara Diallo', 'amara.diallo@riverside.edu', 'Teacher', ['Riverside North']),
    user('usr-08', 'Tomas Novak', 'tomas.novak@riverside.edu', 'Teacher', ['Main Branch']),
    user('usr-09', 'Michael Carter', 'michael.carter@mail.com', 'Parent', ['Main Branch']),
    user('usr-10', 'Linh Nguyen', 'linh.nguyen@mail.com', 'Parent', ['Main Branch']),
    user('usr-11', 'Victor Lopez', 'victor.lopez@mail.com', 'Parent', ['Riverside North']),
    user('usr-12', 'Helen Castillo', 'helen.castillo@riverside.edu', 'Teacher', ['Riverside East'], Status.Inactive),
    user('usr-13', 'Grace Mwangi', 'grace.mwangi@riverside.edu', 'Admissions', ['Main Branch', 'Siem Reap Campus']),
    user('usr-14', 'Peter Lindqvist', 'peter.lindqvist@riverside.edu', 'Admissions', ['Main Branch'], Status.Inactive),
  ]);

  readonly users = this._users.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: UserRecord): void {
    this._users.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._users.update((current) => removeById(current, id));
  }
}

/** Role row for the Roles tab, with the branch names spelled out for display. */
export interface RoleRecord extends Role {
  branchNames: string[];
}

const ALL_ACTIONS = [
  PermissionAction.View,
  PermissionAction.Create,
  PermissionAction.Edit,
  PermissionAction.Delete,
];

function role(
  id: string,
  name: string,
  isDefault: boolean,
  modules: string[],
  branchNames: string[],
  defaultType?: DefaultRoleType,
): RoleRecord {
  return {
    id,
    name,
    isDefault,
    defaultType,
    permissions: modules.map((module) => ({ module, actions: ALL_ACTIONS })),
    branchIds: branchNames.map((branch) => branch.toLowerCase().replace(/\s+/g, '-')),
    branchNames,
  };
}

const EVERY_BRANCH = ['All branches'];

@Injectable({ providedIn: 'root' })
export class RoleService {
  /**
   * 64-users-and-roles.md: the five default roles are fixed — they cannot be
   * edited or deleted, and "Branch Admin" is deliberately not among them.
   */
  private readonly _roles = signal<RoleRecord[]>([
    role('rol-01', 'Admin / Owner', true, ['students', 'teachers', 'parents', 'academic', 'finance', 'reports', 'settings'], EVERY_BRANCH, DefaultRoleType.Owner),
    role('rol-02', 'Accounting', true, ['students', 'finance', 'reports'], EVERY_BRANCH, DefaultRoleType.Accounting),
    role('rol-03', 'Teacher', true, ['students', 'academic', 'attendance'], EVERY_BRANCH, DefaultRoleType.Teacher),
    role('rol-04', 'Parent', true, ['students', 'finance'], EVERY_BRANCH, DefaultRoleType.Parent),
    role('rol-05', 'Student', true, ['academic'], EVERY_BRANCH, DefaultRoleType.Student),
    role('rol-06', 'Admissions', false, ['students', 'parents', 'reports'], ['Main Branch', 'Siem Reap Campus']),
    role('rol-07', 'Librarian', false, ['students'], ['Main Branch']),
    role('rol-08', 'Head of Department', false, ['teachers', 'academic', 'reports'], ['Main Branch', 'Riverside North']),
  ]);

  readonly roles = this._roles.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: RoleRecord): void {
    this._roles.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._roles.update((current) => removeById(current, id));
  }
}
