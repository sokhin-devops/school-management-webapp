import { Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreeModule } from 'primeng/tree';
import type { TreeNode } from 'primeng/api';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { RoleRecord } from '../../../../core/services/role.service';
import { PermissionAction } from '../../../../core/models';
import { humanize } from '../../../../share/data/format';

/** The eight modules of the grid, in the order the sidebar shows them. */
const MODULES = ['students', 'teachers', 'parents', 'academic', 'attendance', 'finance', 'reports', 'settings'] as const;

const ACTIONS: readonly PermissionAction[] = [
  PermissionAction.View,
  PermissionAction.Create,
  PermissionAction.Edit,
  PermissionAction.Delete,
];

/** A permission as the form holds it: "students:view". */
type PermissionKey = `${string}:${string}`;

/**
 * Create / edit a role - 64-users-and-roles.md: "Permission UI uses a checkbox
 * tree", each module opening onto View, Create, Edit and Delete.
 *
 * The tree is PrimeNG's own checkbox tree, so ticking a module ticks its four
 * actions and a module with some of them shows as partly ticked. What it holds
 * is mirrored into a form control, so the one validation path - and its dialog
 * - covers the permissions too.
 */
@Component({
  selector: 'app-role-form',
  imports: [ReactiveFormsModule, InputTextModule, MultiSelectModule, TreeModule, FormDialogComponent, FormFieldComponent],
  templateUrl: './role-form.component.html',
  host: { class: 'k-form-host' },
})
export class RoleFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly role = input<RoleRecord | null>(null);
  readonly branchOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<RoleRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    permissions: [[] as PermissionKey[], Validators.required],
    // Empty means every branch, as the API reads it.
    branchIds: [[] as string[]],
  });

  /**
   * Built once: the tree keeps its expanded and partial state on these same
   * objects, and a fresh array per check would reset both on every pass.
   */
  protected readonly nodes: TreeNode[] = MODULES.map((module) => ({
    key: module,
    label: humanize(module),
    expanded: false,
    children: ACTIONS.map((action) => ({
      key: `${module}:${action}`,
      label: humanize(action),
      data: { module, action },
      leaf: true,
    })),
  }));

  protected readonly selection = signal<TreeNode[]>([]);

  protected readonly branchChoices = computed(() => [...this.branchOptions()]);

  protected readonly isEdit = computed(() => this.role() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    permissions: 'Permissions',
    branchIds: 'Branches',
  } as const;

  /** How many of the 32 boxes are ticked, for the hint under the tree. */
  protected readonly grantedCount = computed(() => this.leavesOf(this.selection()).length);

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.role();
      untracked(() => this.reset(record));
    });
  }

  protected onSelectionChange(selection: TreeNode | TreeNode[] | null): void {
    const nodes = Array.isArray(selection) ? selection : selection ? [selection] : [];
    this.selection.set(nodes);
    this.form.controls.permissions.setValue(this.leavesOf(nodes));
    this.form.controls.permissions.markAsTouched();
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private reset(record: RoleRecord | null): void {
    const granted = new Set<PermissionKey>(
      (record?.permissions ?? []).flatMap((permission) =>
        permission.actions.map((action) => `${permission.module}:${action}` as PermissionKey),
      ),
    );

    // Selected leaves, plus each module whose four are all selected; a module
    // with only some is marked partial - the tree does not work that out for a
    // selection it did not make itself.
    const selection: TreeNode[] = [];
    for (const node of this.nodes) {
      const children = node.children ?? [];
      const ticked = children.filter((child) => granted.has(child.key as PermissionKey));
      selection.push(...ticked);
      node.partialSelected = ticked.length > 0 && ticked.length < children.length;
      node.expanded = node.partialSelected;
      if (ticked.length === children.length && children.length) {
        selection.push(node);
      }
    }

    this.selection.set(selection);
    this.form.reset({
      name: record?.name ?? '',
      permissions: [...granted],
      branchIds: [...(record?.branchIds ?? [])],
    });
  }

  private toRecord(): RoleRecord {
    const value = this.form.getRawValue();
    const existing = this.role();

    const byModule = new Map<string, PermissionAction[]>();
    for (const key of value.permissions) {
      const [module, action] = key.split(':');
      byModule.set(module, [...(byModule.get(module) ?? []), action as PermissionAction]);
    }

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      name: value.name.trim(),
      // Only the five seeded roles are default; anything made here is custom.
      isDefault: existing?.isDefault ?? false,
      permissions: [...byModule.entries()].map(([module, actions]) => ({ module, actions })),
      branchIds: value.branchIds,
      branchNames: this.branchChoices()
        .filter((choice) => value.branchIds.includes(choice.value))
        .map((choice) => choice.label),
    };
  }

  /** Only the actions count; a ticked module is its four actions, already in the list. */
  private leavesOf(nodes: TreeNode[]): PermissionKey[] {
    return nodes.filter((node) => node.leaf).map((node) => node.key as PermissionKey);
  }
}
