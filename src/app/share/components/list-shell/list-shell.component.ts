import { Component } from '@angular/core';
import { FloatingScrollDirective } from '../../directives/floating-scroll.directive';

/**
 * The frame every record-list page sits in: a toolbar that stays put, one
 * scrolling pane in the middle, and a pinned footer for the paginator. Pages
 * fill the slots and never re-solve the scroll layout.
 *
 * ```html
 * <k-list-shell>
 *   <k-list-toolbar k-toolbar />
 *   <p-dataview class="k-dataview" />
 *   <p-paginator k-footer />
 * </k-list-shell>
 * ```
 */
@Component({
  selector: 'k-list-shell',
  imports: [FloatingScrollDirective],
  templateUrl: './list-shell.component.html',
  styleUrl: './list-shell.component.scss',
})
export class ListShellComponent {}
