import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  RecordDrawerComponent,
  type RecordDetail,
  RowActionsComponent,
  type RowAction,
  StatusTagComponent,
} from '../../../share/components';
import { humanize, statusBadge } from '../../../share/data/format';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { UserRecord, UserService } from '../../../core/services/user.service';
import { RoleRecord, RoleService } from '../../../core/services/role.service';
import { Status } from '../../../core/models';
import { BranchContextService } from '../../../core/services/branch-context.service';
import { PermissionService } from '../../../core/services/permission.service';
import { RoleFormComponent } from './role-form/role-form.component';
import { UserFormComponent } from './user-form/user-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { TwoFactorService } from '../../../core/services/two-factor.service';
import { describeFailure } from '../../../core/api/api-failure';
import { MessageService } from 'primeng/api';
import { PermissionAction } from '../../../core/models';

/** 64-users-and-roles.md — Users and Roles, as two tabs of one settings page. */
@Component({
  selector: 'app-users-roles',
  providers: [SaveState],
  imports: [
    RouterLink,
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
    RecordDrawerComponent,
  ],
  templateUrl: './users-roles.component.html',
  styleUrl: './users-roles.component.scss',
})
export class UsersRolesComponent {
  protected readonly userService = inject(UserService);
  protected readonly roleService = inject(RoleService);
  private readonly branchContext = inject(BranchContextService);
  private readonly permissions = inject(PermissionService);


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
      .map((role) => ({ label: role.name, value: role.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly branchOptions = computed(() =>
    this.branchContext.branches().map((branch) => ({ label: branch.name, value: branch.id })),
  );

  /** Bound to the tabs so Quick Add can bring the right list forward. */
  protected readonly activeTab = signal<'users' | 'roles'>('users');

  /** One for both forms: only one of them is ever open. */
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly userFormVisible = signal(false);
  protected readonly editingUser = signal<UserRecord | null>(null);

  protected readonly roleFormVisible = signal(false);
  protected readonly editingRole = signal<RoleRecord | null>(null);

  constructor() {
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
    this.saveState.run(this.userService.save(user), {
      success: user.id ? 'User saved' : 'Invitation sent',
      done: () => {
        this.userFormVisible.set(false);
        // The users list carries each person's role name, which the server
        // resolves, so it is read back rather than patched locally.
        this.userService.reload();
      },
    });
  }

  // --- Details -------------------------------------------------------------
  //
  // One drawer per tab, for the same reason there is one form per tab.

  protected readonly viewingUser = signal<UserRecord | null>(null);
  protected readonly userViewVisible = signal(false);
  protected readonly userDetail = computed<RecordDetail | null>(() => {
    const user = this.viewingUser();
    if (!user) {
      return null;
    }
    return {
      title: user.fullName,
      subtitle: user.email,
      badge: statusBadge(user.status),
      facts: [
        { label: 'Role', value: user.roleName },
        { label: 'Two-factor', value: user.twoFactorEnabled ? 'On' : 'Off' },
        { label: 'Branches', value: this.branchLabel(user.branchIds), wide: true },
      ],
    };
  });

  // --- Two-factor reset ------------------------------------------------------
  //
  // 67-security.md: for someone who has lost their phone and their recovery
  // codes. Asked twice, in place, since it weakens how that person signs in.

  private readonly twoFactor = inject(TwoFactorService);
  private readonly messages = inject(MessageService);
  protected readonly resetConfirming = signal(false);
  protected readonly resetting = signal(false);
  protected readonly canResetTwoFactor = computed(() =>
    this.permissions.can(this.permissions.currentModule(), PermissionAction.Delete),
  );

  protected resetTwoFactor(user: UserRecord): void {
    this.resetting.set(true);
    this.twoFactor.resetFor(user.id).subscribe({
      next: () => {
        this.resetting.set(false);
        this.resetConfirming.set(false);
        this.viewingUser.set({ ...user, twoFactorEnabled: false });
        this.userService.reload();
        this.messages.add({ severity: 'success', summary: 'Two-factor reset', detail: `${user.fullName} signs in with their password next time.`, life: 4000 });
      },
      error: (failure: unknown) => {
        this.resetting.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not reset two-factor', detail: describeFailure(failure) });
      },
    });
  }

  protected readonly viewingRole = signal<RoleRecord | null>(null);
  protected readonly roleViewVisible = signal(false);
  protected readonly roleDetail = computed<RecordDetail | null>(() => {
    const role = this.viewingRole();
    if (!role) {
      return null;
    }
    const granted = role.permissions.filter((permission) => permission.actions.length > 0);
    return {
      title: role.name,
      subtitle: role.isDefault ? 'Default role — can be looked at, not changed' : 'Custom role',
      facts: [
        { label: 'Held by', value: role.userCount === undefined ? null : `${role.userCount} user${role.userCount === 1 ? '' : 's'}` },
        { label: 'Branches', value: this.branchLabel(role.branchIds ?? []) },
        // One line per module, so the grid reads the way it was ticked.
        ...(granted.length
          ? granted.map((permission) => ({
              label: humanize(permission.module),
              value: permission.actions.map((action) => humanize(action)).join(', '),
              wide: true,
            }))
          : [{ label: 'Permissions', value: 'None granted', wide: true }]),
      ],
    };
  });

  protected openViewUser(user: UserRecord): void {
    this.viewingUser.set(user);
    this.resetConfirming.set(false);
    this.userViewVisible.set(true);
  }

  protected openViewRole(role: RoleRecord): void {
    this.viewingRole.set(role);
    this.roleViewVisible.set(true);
  }

  /** Empty means every branch — the same rule the API applies. */
  private branchLabel(branchIds: readonly string[]): string {
    if (!branchIds.length) {
      return 'All branches';
    }
    const names = new Map(this.branchContext.branches().map((branch) => [branch.id, branch.name]));
    return branchIds.map((id) => names.get(id) ?? 'A deleted branch').join(', ');
  }

  protected confirmRemoveUser(user: UserRecord): void {
    this.removal.confirm({
      noun: 'user',
      name: user.fullName,
      consequence: 'They lose access to this school; their account itself is kept.',
      remove: () => this.userService.remove(user.id),
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
    this.saveState.run(this.roleService.save(role), {
      success: 'Role saved',
      done: () => this.roleFormVisible.set(false),
    });
  }

  protected confirmRemoveRole(role: RoleRecord): void {
    this.removal.confirm({
      noun: 'role',
      name: role.name,
      remove: () => this.roleService.remove(role.id),
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
    // Without custom roles in the plan, a role made before a downgrade can still
    // be looked at; the server refuses changing it.
    return role.isDefault || !this.customRoles() ? UsersRolesComponent.VIEW_ONLY : UsersRolesComponent.EVERY_ACTION;
  }

  /** 68-subscription.md: custom roles are part of the plan, not of every plan. */
  protected readonly customRoles = computed(() => this.permissions.planIncludes('CUSTOM_ROLES'));

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
