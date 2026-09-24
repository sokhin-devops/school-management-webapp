import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultRoleType, PermissionAction, Role } from '../models';
import { ApiPermissionAction, ApiRole } from '../api/api.models';
import { createTenantResource } from '../api/tenant-resource';

/** A role row for the Roles tab, with the branch names spelled out for display. */
export interface RoleRecord extends Role {
  branchNames: string[];
  /** Filled by the server; a role being created is held by nobody yet. */
  userCount?: number;
}

/** The body POST and PUT /api/v1/roles accept. */
interface RoleWrite {
  name: string;
  permissions: { module: string; actions: ApiPermissionAction[] }[];
  branchIds: string[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly resource = createTenantResource<ApiRole, RoleWrite>('api/v1/roles');

  readonly roles = computed(() => this.resource.items().map(toRole));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  save(role: RoleRecord): Observable<ApiRole> {
    const body = toWrite(role);
    return role.id ? this.resource.update(role.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toRole(role: ApiRole): RoleRecord {
  return {
    id: role.id,
    name: role.name,
    isDefault: role.isDefault,
    defaultType: role.defaultType ? (role.defaultType.toLowerCase() as DefaultRoleType) : undefined,
    permissions: (role.permissions ?? []).map((permission) => ({
      module: permission.module,
      actions: permission.actions.map((action) => action.toLowerCase() as PermissionAction),
    })),
    branchIds: role.branchIds ?? [],
    // Resolved by the page, which already has the branches.
    branchNames: [],
    userCount: role.userCount,
  };
}

function toWrite(role: RoleRecord): RoleWrite {
  return {
    name: role.name,
    permissions: (role.permissions ?? []).map((permission) => ({
      module: permission.module,
      actions: permission.actions.map((action) => action.toUpperCase() as ApiPermissionAction),
    })),
    // An empty list means every branch of the tenant, which is what the default
    // roles hold and what the form sends when nothing is picked.
    branchIds: role.branchIds ?? [],
  };
}
