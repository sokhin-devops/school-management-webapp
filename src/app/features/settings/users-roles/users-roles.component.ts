import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { RoleRecord, RoleService, UserRecord, UserService } from '../../../core/services/user.service';
import { Status } from '../../../core/models';

/** 64-users-and-roles.md — Users and Roles, as two tabs of one settings page. */
@Component({
  selector: 'app-users-roles',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TabsModule,
    AvatarModule,
    TableModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
  ],
  templateUrl: './users-roles.component.html',
  styleUrl: './users-roles.component.scss',
})
export class UsersRolesComponent {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);

  // --- Users tab -----------------------------------------------------------

  protected readonly roleFilter = new RecordFilter<UserRecord, string>(
    (user, value) => user.roleName === value,
  );

  protected readonly statusFilter = new RecordFilter<UserRecord, Status>(
    (user, value) => user.status === value,
  );

  protected readonly users = createRecordList<UserRecord>({
    source: this.userService.users,
    searchKeys: [(user) => user.fullName, (user) => user.email, (user) => user.roleName],
    sortKeys: {
      fullName: (user) => user.fullName,
      email: (user) => user.email,
      roleName: (user) => user.roleName,
      status: (user) => user.status,
    },
    defaultSortField: 'fullName',
    filters: [this.roleFilter, this.statusFilter] as never[],
    noun: { one: 'user', many: 'users' },
    pageSize: 24,
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly roleOptions = computed(() =>
    Array.from(new Set(this.userService.users().map((user) => user.roleName)))
      .sort((a, b) => a.localeCompare(b))
      .map((roleName) => ({ label: roleName, value: roleName })),
  );

  // --- Roles tab -----------------------------------------------------------

  protected readonly roles = createRecordList<RoleRecord>({
    source: this.roleService.roles,
    searchKeys: [(role) => role.name],
    sortKeys: { name: (role) => role.name },
    defaultSortField: 'name',
    noun: { one: 'role', many: 'roles' },
    pageSize: 24,
  });

  protected initials(fullName: string): string {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected permissionCount(role: RoleRecord): number {
    return role.permissions.reduce((sum, permission) => sum + permission.actions.length, 0);
  }
}
