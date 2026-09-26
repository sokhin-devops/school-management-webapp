import { Component, computed, inject, input, model, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../../core/services/permission.service';

export type RecordBadgeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface RecordFact {
  readonly label: string;
  /** Null, undefined and '' all read as a dash, so a page can pass a field as it is. */
  readonly value: string | number | null | undefined;
  /** Takes the full width — a description, an address, a list of names. */
  readonly wide?: boolean;
}

/** What one record looks like when it is read rather than edited. */
export interface RecordDetail {
  readonly title: string;
  readonly subtitle?: string;
  readonly badge?: { readonly label: string; readonly severity: RecordBadgeSeverity };
  readonly facts: readonly RecordFact[];
}

/**
 * The read-only side of a record: what the eye icon on every row opens.
 *
 * A drawer rather than a page of its own, so reading a record never loses the
 * reader's place in a filtered, sorted, paginated list — closing it puts them
 * back exactly where they were.
 *
 * It offers Edit and Delete only where the role allows them on this page, and
 * closes itself before handing either back, so the form or the confirmation
 * opens over the list rather than over the drawer.
 */
@Component({
  selector: 'k-record-drawer',
  imports: [ButtonModule, DrawerModule, TagModule],
  templateUrl: './record-drawer.component.html',
  styleUrl: './record-drawer.component.scss',
})
export class RecordDrawerComponent {
  private readonly permissions = inject(PermissionService);

  readonly visible = model<boolean>(false);
  readonly detail = input<RecordDetail | null>(null);
  /** Pages that cannot change a record from here — a default role — turn these off. */
  readonly editable = input(true);
  readonly removable = input(true);

  readonly edit = output<void>();
  readonly remove = output<void>();

  protected readonly canEdit = computed(
    () => this.editable() && this.permissions.canEdit(this.permissions.currentModule()),
  );
  protected readonly canRemove = computed(
    () => this.removable() && this.permissions.canDelete(this.permissions.currentModule()),
  );

  protected display(value: RecordFact['value']): string {
    return value === null || value === undefined || value === '' ? '—' : String(value);
  }

  protected onEdit(): void {
    this.visible.set(false);
    this.edit.emit();
  }

  protected onRemove(): void {
    this.visible.set(false);
    this.remove.emit();
  }
}
