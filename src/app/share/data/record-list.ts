import { Signal, computed, signal } from '@angular/core';
import type { SortEvent } from 'primeng/api';
import type { PaginatorState } from 'primeng/paginator';

/**
 * One dropdown filter on a record list. Holding the predicate next to the value
 * is what lets `createRecordList` clear every filter, and know whether any is
 * active, without the page wiring that up each time.
 *
 * ```ts
 * protected readonly status = new RecordFilter<Fee, Status>((fee, value) => fee.status === value);
 * ```
 */
export class RecordFilter<T, V> {
  /** `null` means the filter is off — bind it straight to a `p-select` with `[showClear]`. */
  readonly value = signal<V | null>(null);

  constructor(private readonly predicate: (item: T, value: V) => boolean) {}

  test(item: T): boolean {
    const value = this.value();
    return value === null ? true : this.predicate(item, value);
  }

  isActive(): boolean {
    return this.value() !== null;
  }

  clear(): void {
    this.value.set(null);
  }
}

export interface RecordListOptions<T> {
  readonly source: Signal<readonly T[]>;
  /** Every field the search box looks through. */
  readonly searchKeys: ReadonlyArray<(item: T) => string | number | undefined | null>;
  /** Sortable columns, keyed by the name used in `pSortableColumn`. */
  readonly sortKeys: Readonly<Record<string, (item: T) => string | number>>;
  readonly defaultSortField: string;
  readonly filters?: ReadonlyArray<RecordFilter<T, never>>;
  /** Used for the "12 of 40 teachers" summary. */
  readonly noun: { readonly one: string; readonly many: string };
  readonly pageSize?: number;
  readonly pageSizeOptions?: readonly number[];
}

/**
 * Search, filter, sort and page state for a record list — the part every list
 * page in the app repeats verbatim.
 *
 * Sorting lives here rather than inside `p-table` because paging is external:
 * letting the table sort would only reorder the rows already on screen. Pages
 * run the table with `[customSort]` and hand `(sortFunction)` straight to
 * `onSort`.
 */
export class RecordList<T> {
  readonly search = signal('');
  readonly sortField: ReturnType<typeof signal<string>>;
  readonly sortOrder = signal<1 | -1>(1);
  readonly first = signal(0);
  readonly rows: ReturnType<typeof signal<number>>;
  readonly pageSizeOptions: number[];

  readonly total: Signal<number>;
  readonly matching: Signal<T[]>;
  readonly sorted: Signal<T[]>;
  readonly page: Signal<T[]>;
  readonly hasFilters: Signal<boolean>;
  readonly countLabel: Signal<string>;

  private readonly filters: ReadonlyArray<RecordFilter<T, never>>;

  constructor(private readonly options: RecordListOptions<T>) {
    this.filters = options.filters ?? [];
    this.sortField = signal(options.defaultSortField);
    this.rows = signal(options.pageSize ?? 12);
    this.pageSizeOptions = [...(options.pageSizeOptions ?? [12, 24, 48])];

    this.total = computed(() => options.source().length);

    this.matching = computed(() => {
      const term = this.search().trim().toLowerCase();

      return options.source().filter((item) => {
        if (!this.filters.every((filter) => filter.test(item))) {
          return false;
        }
        if (!term) {
          return true;
        }

        return options.searchKeys.some((read) => String(read(item) ?? '').toLowerCase().includes(term));
      });
    });

    this.sorted = computed(() => {
      const key = options.sortKeys[this.sortField()];
      if (!key) {
        return [...this.matching()];
      }
      const order = this.sortOrder();

      return [...this.matching()].sort((a, b) => compare(key(a), key(b)) * order);
    });

    this.page = computed(() => this.sorted().slice(this.first(), this.first() + this.rows()));

    this.hasFilters = computed(
      () => !!this.search().trim() || this.filters.some((filter) => filter.isActive()),
    );

    this.countLabel = computed(() => {
      const total = this.total();
      const shown = this.matching().length;
      const noun = total === 1 ? options.noun.one : options.noun.many;

      return this.hasFilters() ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
    });
  }

  onSearch(term: string): void {
    this.search.set(term);
    this.first.set(0);
  }

  /** Call after changing any filter's value, so the reader is not left on a page that no longer exists. */
  onFilterChange(): void {
    this.first.set(0);
  }

  /**
   * Setting a signal to the value it already holds is a no-op, which is what
   * stops the re-sorted page flowing back into the table's `[value]` and cycling.
   */
  onSort(event: SortEvent): void {
    const field = event.field;
    if (!field || !(field in this.options.sortKeys)) {
      return;
    }

    this.sortField.set(field);
    this.sortOrder.set(event.order === -1 ? -1 : 1);
    this.first.set(0);
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  clear(): void {
    this.search.set('');
    this.filters.forEach((filter) => filter.clear());
    this.first.set(0);
  }
}

export function createRecordList<T>(options: RecordListOptions<T>): RecordList<T> {
  return new RecordList<T>(options);
}

/** Numbers compare numerically; everything else compares as locale-aware text. */
function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}
