import { Injectable, signal } from '@angular/core';
import { DefaultRoleType, PermissionAction, Role, RolePermission } from '../models';
import { BRANCH_IDS } from './branch-mock.service';

const MODULE_LABELS: Readonly<Record<string, string | undefined>> = {
  students: 'Students',
  teachers: 'Teachers',
  parents: 'Parents',
  academic: 'Academic',
  attendance: 'Attendance',
  exams: 'Exams',
  finance: 'Finance',
  reports: 'Reports',
  settings: 'Settings',
};

const MODULES = Object.keys(MODULE_LABELS);

const FULL = [PermissionAction.View, PermissionAction.Create, PermissionAction.Edit, PermissionAction.Delete];
const MANAGE = [PermissionAction.View, PermissionAction.Create, PermissionAction.Edit];
const VIEW = [PermissionAction.View];

/** Turns a permission module key into the label the Roles list shows. */
export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}

function perm(module: string, actions: PermissionAction[]): RolePermission {
  return { module, actions };
}

function defaultRole(
  id: string,
  name: string,
  defaultType: DefaultRoleType,
  permissions: RolePermission[],
): Role {
  // A default role is school-wide by definition — it is not something a branch
  // administrator scopes down, which is why 64-users-and-roles.md locks it.
  return { id, name, isDefault: true, defaultType, permissions, branchIds: [...BRANCH_IDS] };
}

function customRole(id: string, name: string, permissions: RolePermission[], branchIds: string[]): Role {
  return { id, name, isDefault: false, permissions, branchIds };
}

function seedRoles(): Role[] {
  return [
    defaultRole(
      'role-owner',
      'Owner',
      DefaultRoleType.Owner,
      MODULES.map((module) => perm(module, FULL)),
    ),
    defaultRole('role-accounting', 'Accounting', DefaultRoleType.Accounting, [
      perm('students', VIEW),
      perm('parents', VIEW),
      perm('finance', FULL),
      perm('reports', VIEW),
    ]),
    defaultRole('role-teacher', 'Teacher', DefaultRoleType.Teacher, [
      perm('students', VIEW),
      perm('academic', VIEW),
      perm('attendance', MANAGE),
      perm('exams', MANAGE),
    ]),
    defaultRole('role-parent', 'Parent', DefaultRoleType.Parent, [
      perm('students', VIEW),
      perm('attendance', VIEW),
      perm('exams', VIEW),
      perm('finance', VIEW),
    ]),
    defaultRole('role-student', 'Student', DefaultRoleType.Student, [
      perm('academic', VIEW),
      perm('attendance', VIEW),
      perm('exams', VIEW),
    ]),

    customRole(
      'role-registrar',
      'Registrar',
      [perm('students', FULL), perm('parents', MANAGE), perm('academic', MANAGE), perm('reports', VIEW)],
      ['branch-1', 'branch-4'],
    ),
    customRole(
      'role-admissions',
      'Admissions Officer',
      [perm('students', MANAGE), perm('parents', MANAGE), perm('reports', VIEW)],
      ['branch-1', 'branch-2', 'branch-5'],
    ),
    customRole(
      'role-exams',
      'Exam Coordinator',
      [perm('students', VIEW), perm('academic', VIEW), perm('exams', FULL), perm('reports', VIEW)],
      ['branch-9', 'branch-10', 'branch-11'],
    ),
    customRole(
      'role-librarian',
      'Librarian',
      [perm('students', VIEW), perm('academic', VIEW)],
      ['branch-3'],
    ),
    customRole(
      'role-front-desk',
      'Front Desk',
      [perm('students', VIEW), perm('parents', VIEW), perm('attendance', VIEW)],
      ['branch-1'],
    ),
    customRole(
      'role-campus-ops',
      'Campus Operations',
      [perm('academic', MANAGE), perm('attendance', VIEW), perm('settings', VIEW)],
      ['branch-2', 'branch-6', 'branch-7'],
    ),
  ];
}

/** 64-users-and-roles.md — the default and custom roles behind Settings > Users & Roles. */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly _roles = signal<Role[]>(seedRoles());
  readonly roles = this._roles.asReadonly();
}
