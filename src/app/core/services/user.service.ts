import { Injectable, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Status, User } from '../models';
import { ApiTenantUser } from '../api/api.models';
import { ApiClientService } from './api-client.service';
import { createTenantResource } from '../api/tenant-resource';

/** A user row for Settings > Users, with the role and branch names for display. */
export interface UserRecord extends User {
  roleName: string;
  branchNames: string[];
}

/** POST /api/v1/users is an invitation; PUT is an edit. They differ. */
interface UserInvite {
  fullName: string;
  email: string;
  roleId: string;
  branchIds: string[];
}

interface UserUpdate {
  fullName: string;
  roleId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  branchIds: string[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClientService);
  private readonly resource = createTenantResource<ApiTenantUser, UserInvite>('api/v1/users');

  readonly users = computed(() => this.resource.items().map(toUser));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /**
   * Inviting and editing are different operations, not one upsert: an invitation
   * creates an account and cannot change a status, and an edit cannot change the
   * email an account is identified by.
   */
  save(user: UserRecord): Observable<ApiTenantUser> {
    if (!user.id) {
      return this.resource.create({
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        branchIds: user.branchIds ?? [],
      });
    }

    const body: UserUpdate = {
      fullName: user.fullName,
      roleId: user.roleId,
      status: user.status === Status.Inactive ? 'INACTIVE' : 'ACTIVE',
      branchIds: user.branchIds ?? [],
    };
    // Keyed by the account id, which is what the endpoint takes, not the
    // membership row's own id.
    return this.api.put<ApiTenantUser>(`api/v1/users/${user.id}`, body);
  }

  remove(userId: string): Observable<void> {
    return this.resource.remove(userId);
  }
}

function toUser(user: ApiTenantUser): UserRecord {
  return {
    // The account id, because that is what every write about this person takes.
    id: user.userId,
    fullName: user.fullName,
    email: user.email,
    roleId: user.roleId ?? '',
    branchIds: user.branchIds ?? [],
    status: user.status === 'ACTIVE' ? Status.Active : Status.Inactive,
    roleName: user.roleName ?? '',
    // Resolved by the page, which already has the branches.
    branchNames: [],
  };
}
