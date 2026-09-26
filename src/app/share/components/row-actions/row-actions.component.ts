import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PermissionAction } from '../../../core/models';
import { PermissionService } from '../../../core/services/permission.service';

export type RowAction = 'view' | 'edit' | 'delete';

const ALL_ACTIONS: readonly RowAction[] = ['view', 'edit', 'delete'];

/**
 * The view / edit / delete trio that every record row and record card ends with.
 * It only reports what was clicked — the page it sits on decides what that means.
 */
@Component({
  selector: 'k-row-actions',
  imports: [ButtonModule, TooltipModule],
  templateUrl: './row-actions.component.html',
  styleUrl: './row-actions.component.scss',
})
export class RowActionsComponent {
  private readonly permissions = inject(PermissionService);

  /** Lets a page drop an action it cannot offer, without a variant component. */
  readonly actions = input<readonly RowAction[]>(ALL_ACTIONS);

  /**
   * Names the record for screen readers only. The tooltip stays a bare verb —
   * repeating the row's own name back at a sighted reader who is already
   * pointing at that row adds nothing — but an accessible name of "View" on
   * fifteen identical buttons is useless, so the label rides the aria-label.
   */
  readonly label = input<string>('');

  readonly view = output<void>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  /**
   * Which of the three this role may actually use, taken from the page the row
   * is on. Deciding it here rather than at each of the sixteen call sites means
   * a page cannot forget to ask.
   */
  private readonly permitted = computed(() => {
    const module = this.permissions.currentModule();
    const byAction: Record<RowAction, PermissionAction> = {
      view: PermissionAction.View,
      edit: PermissionAction.Edit,
      delete: PermissionAction.Delete,
    };
    return this.actions().filter((action) => this.permissions.can(module, byAction[action]));
  });

  protected has(action: RowAction): boolean {
    return this.permitted().includes(action);
  }

  protected describe(verb: string): string {
    const label = this.label();
    return label ? `${verb} ${label}` : verb;
  }
}
