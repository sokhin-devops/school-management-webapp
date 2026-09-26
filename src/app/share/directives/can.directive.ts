import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PermissionAction } from '../../core/models';
import { PermissionService } from '../../core/services/permission.service';

/**
 * Keeps an element out of the page unless the role allows that action here.
 *
 * ```html
 * <p-button *kCan="'create'" label="New Program" (onClick)="openForm()" />
 * ```
 *
 * The module comes from the route, so a page says what the button does and
 * never has to repeat which module it belongs to.
 */
@Directive({ selector: '[kCan]' })
export class CanDirective {
  private readonly permissions = inject(PermissionService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  readonly kCan = input.required<PermissionAction | 'create' | 'edit' | 'delete' | 'view'>();

  constructor() {
    effect(() => {
      const module = this.permissions.currentModule();
      const allowed = this.permissions.can(module, this.kCan() as PermissionAction);

      // Cleared and rebuilt rather than toggled with a flag: the content is a
      // button, and a hidden button is still in the tab order.
      this.container.clear();
      if (allowed) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
