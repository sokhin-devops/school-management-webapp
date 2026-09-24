import { Signal, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClientService } from '../services/api-client.service';
import { ApiPage } from './api.models';
import { describeFailure } from './api-failure';

/** Matches the branch resource: the screens page client-side, so one fetch brings the set. */
const FETCH_SIZE = 500;

export interface TenantResource<T, TWrite> {
  readonly items: Signal<readonly T[]>;
  readonly loading: Signal<boolean>;
  readonly loaded: Signal<boolean>;
  readonly error: Signal<string | null>;

  reload(): void;
  create(body: TWrite): Observable<T>;
  update(id: string, body: TWrite): Observable<T>;
  remove(id: string): Observable<void>;
}

/**
 * A collection that belongs to the tenant rather than to a branch — roles, the
 * people who hold them, the academic years, the students.
 *
 * Unlike the branch resource this has nothing to watch, so it loads the first
 * time a page asks and stays put until something writes to it. Pages call
 * `reload()` from their constructor.
 *
 * @param paged true when the endpoint answers with a PagedResponse rather than
 *              a plain array. The API is split on this and the shape is not
 *              something a caller should have to remember.
 */
export function createTenantResource<T extends { id: string }, TWrite>(
  path: string,
  options: { paged?: boolean } = {},
): TenantResource<T, TWrite> {
  const api = inject(ApiClientService);

  const items = signal<readonly T[]>([]);
  const loading = signal(false);
  const loaded = signal(false);
  const error = signal<string | null>(null);

  const load = (): void => {
    loading.set(true);
    error.set(null);

    const params = options.paged ? { size: FETCH_SIZE } : undefined;
    api.get<T[] | ApiPage<T>>(path, params).subscribe({
      next: (body) => {
        items.set(Array.isArray(body) ? body : (body?.content ?? []));
        loading.set(false);
        loaded.set(true);
      },
      error: (failure: unknown) => {
        items.set([]);
        error.set(describeFailure(failure));
        loading.set(false);
        loaded.set(true);
      },
    });
  };

  // Loads the first time something reads it, rather than when a page decides to
  // ask. A constructor that kicks off a fetch has to be remembered by every page
  // that borrows the list, and forgetting leaves a blank table with no error.
  //
  // The load is deferred to a microtask because a computed may not write to a
  // signal while it is being read.
  let started = false;
  const view = computed(() => {
    if (!started) {
      started = true;
      queueMicrotask(load);
    }
    return items();
  });

  return {
    items: view,
    loading: loading.asReadonly(),
    loaded: loaded.asReadonly(),
    error: error.asReadonly(),
    reload: () => {
      started = true;
      load();
    },
    create: (body) => api.post<T>(path, body).pipe(tap(load)),
    update: (id, body) => api.put<T>(`${path}/${id}`, body).pipe(tap(load)),
    remove: (id) => api.delete<void>(`${path}/${id}`).pipe(tap(load)),
  };
}
