import { Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * What a record list looks like while its first load is in flight.
 *
 * Shaped like the rows and cards it stands in for, and at the same widths, so
 * the page does not jump when the real data lands. A spinner in the middle of an
 * empty panel would tell the reader less and move more.
 *
 * Only for the first load: a reload leaves the rows that are already there, and
 * replacing them with grey bars would read as the list having been emptied.
 */
@Component({
  selector: 'k-list-skeleton',
  imports: [SkeletonModule],
  templateUrl: './list-skeleton.component.html',
  styleUrl: './list-skeleton.component.scss',
})
export class ListSkeletonComponent {
  readonly layout = input<'list' | 'grid'>('list');
  readonly rows = input<number>(8);
  /** Column widths, as percentages, so the bars line up with the real header. */
  readonly columns = input<readonly number[]>([30, 16, 14, 18, 10, 12]);

  protected readonly placeholders = computed(() => Array.from({ length: this.rows() }));
  protected readonly cells = computed(() => [...this.columns()]);

  /**
   * A little variation across rows, from the row index alone. Bars of exactly
   * equal length read as a pattern rather than as content on its way.
   */
  protected width(row: number, column: number): string {
    const spread = [92, 70, 84, 60, 78][(row + column) % 5];
    return `${spread}%`;
  }
}
