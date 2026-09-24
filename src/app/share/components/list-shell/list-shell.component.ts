import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FloatingScrollDirective } from '../../directives/floating-scroll.directive';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ListSkeletonComponent } from '../list-skeleton/list-skeleton.component';

/**
 * The frame every record-list page sits in: a toolbar that stays put, one
 * scrolling pane in the middle, and a pinned footer for the paginator. Pages
 * fill the slots and never re-solve the scroll layout.
 *
 * It also owns the two states a page is in before it has anything to show —
 * still loading, and failed — so sixteen list pages do not each write their own.
 *
 * ```html
 * <k-list-shell [loading]="service.loading()" [error]="service.error()" (retry)="service.reload()">
 *   <k-list-toolbar k-toolbar />
 *   <p-dataview class="k-dataview" />
 *   <p-paginator k-footer />
 * </k-list-shell>
 * ```
 */
@Component({
  selector: 'k-list-shell',
  imports: [ButtonModule, FloatingScrollDirective, EmptyStateComponent, ListSkeletonComponent],
  templateUrl: './list-shell.component.html',
  styleUrl: './list-shell.component.scss',
})
export class ListShellComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  /** True once something has arrived. A reload keeps the rows rather than blanking them. */
  readonly hasContent = input(false);
  readonly layout = input<'list' | 'grid'>('list');
  /** Column widths, as percentages, matched to the page's own header. */
  readonly skeletonColumns = input<readonly number[]>([30, 16, 14, 18, 10, 12]);

  readonly retry = output<void>();

  /**
   * Only the first load takes the page away. Once there are rows on screen a
   * reload happens underneath them, because replacing a list someone is reading
   * with grey bars looks like it has been emptied.
   */
  protected readonly showSkeleton = computed(() => this.loading() && !this.hasContent());
  protected readonly showError = computed(() => !this.loading() && !!this.error() && !this.hasContent());
}
