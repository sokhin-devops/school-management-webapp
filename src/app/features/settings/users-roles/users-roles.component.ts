import { Component, computed, inject, signal } from '@angular/core';
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
  type RowAction,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { UserRecord, UserService } from '../../../core/services/user.service';
import { RoleRecord, RoleService } from '../../../core/services/role.service';
import { Status } from '../../../core/models';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { RoleFormComponent } from './role-form/role-form.component';
import { UserFormComponent } from './user-form/user-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';

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
    UserFormComponent,
    RoleFormComponent,
  ],
  templateUrl: './users-roles.component.html',
  styleUrl: './users-roles.component.scss',
})
export class UsersRolesComponent {
  protected readonly userService = inject(UserService);
  protected readonly roleService = inject(RoleService);
  private readonly branchContext = inject(BranchContextService);


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

  // --- Dialogs -------------------------------------------------------------
  //
  // Two lists, so two dialogs; each keeps its own record so opening one never
  // disturbs the other tab.

  /** Roles a user can be given, and branches either dialog can assign. */
  protected readonly roleChoices = computed(() =>
    this.roleService
      .roles()
      .map((role) => ({ label: role.name, value: role.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly branchOptions = computed(() =>
    this.branchContext.branches().map((branch) => ({ label: branch.name, value: branch.name })),
  );

  /** Bound to the tabs so Quick Add can bring the right list forward. */
  protected readonly activeTab = signal<'users' | 'roles'>('users');

  /** A save the server refused, from either tab. */
  protected readonly saveError = signal<string | null>(null);

  protected readonly userFormVisible = signal(false);
  protected readonly editingUser = signal<UserRecord | null>(null);

  protected readonly roleFormVisible = signal(false);
  protected readonly editingRole = signal<RoleRecord | null>(null);

  constructor() {
    // BISECT: roleService.reload() disabled

    openOnQuickAdd('user', () => this.openCreateUser());
    openOnQuickAdd('role', () => this.openCreateRole());
  }

  protected openCreateUser(): void {
    this.activeTab.set('users');
    this.editingUser.set(null);
    this.userFormVisible.set(true);
  }

  protected openEditUser(user: UserRecord): void {
    this.editingUser.set(user);
    this.userFormVisible.set(true);
  }

  protected onUserSaved(user: UserRecord): void {
    this.userService.save(user).subscribe({
      next: () => this.userService.reload(),
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }

  protected openCreateRole(): void {
    // Quick Add can reach this from the Users tab; saving into a list the reader
    // cannot see would look like nothing happened.
    this.activeTab.set('roles');
    this.editingRole.set(null);
    this.roleFormVisible.set(true);
  }

  protected openEditRole(role: RoleRecord): void {
    this.editingRole.set(role);
    this.roleFormVisible.set(true);
  }

  protected onRoleSaved(role: RoleRecord): void {
    this.roleService.save(role).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }

  /**
   * Held as two fixed arrays rather than built in the template.
   *
   * `actions` is a signal input, so a fresh array literal on every change
   * detection is a new value every time: the row never settles, Angular keeps
   * re-running, and the tab eventually runs out of memory and crashes. These two
   * references never change, so the input stops changing with them.
   */
  private static readonly VIEW_ONLY: readonly RowAction[] = ['view'];
  private static readonly EVERY_ACTION: readonly RowAction[] = ['view', 'edit', 'delete'];

  /** 64-users-and-roles.md: a default role can be looked at but not changed. */
  protected actionsFor(role: RoleRecord): readonly RowAction[] {
    return role.isDefault ? UsersRolesComponent.VIEW_ONLY : UsersRolesComponent.EVERY_ACTION;
  }

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
