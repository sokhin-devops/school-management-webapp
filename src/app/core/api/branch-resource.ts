import { Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClientService } from '../services/api-client.service';
import { BranchContextService } from '../services/branch-context.service';
import { ApiPage } from './api.models';
import { describeFailure } from './api-failure';

/**
 * The server pages, and so does the list on screen — but not the same way. The
 * screens search, filter and sort across the whole set client-side, so a page
 * of twelve would give the wrong answer for every one of those. One generous
 * fetch keeps that behaviour honest.
 *
 * Worth moving to server-side paging once a branch holds more records than this;
 * that is a change to every list page, not just to this line.
 */
const FETCH_SIZE = 500;

export interface BranchResource<T, TWrite> {
  /** What the branch holds right now. Empty while the first load is in flight. */
  readonly items: Signal<readonly T[]>;
  /** True only for a load, never for a save — a save must not blank the list. */
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  /** True once a load has finished, so a page can tell "empty" from "not yet asked". */
  readonly loaded: Signal<boolean>;

  reload(): void;
  create(body: TWrite): Observable<T>;
  update(id: string, body: TWrite): Observable<T>;
  remove(id: string): Observable<void>;
}

/**
 * A branch-scoped collection, loaded once per branch and kept in a signal.
 *
 * Reloads itself when the branch switcher changes, because every one of these
 * lists is a list for one branch and showing the previous branch's rows under a
 * new name would be worse than showing none.
 *
 * Call from a field initialiser or a constructor — it injects.
 */
export function createBranchResource<T extends { id: string }, TWrite>(
  path: string,
): BranchResource<T, TWrite> {
  const api = inject(ApiClientService);
  const branchContext = inject(BranchContextService);

  const items = signal<readonly T[]>([]);
  const loading = signal(false);
  const loaded = signal(false);
  const error = signal<string | null>(null);

  const branchId = computed(() => branchContext.selectedBranch()?.id ?? null);

  const load = (): void => {
    const branch = untracked(branchId);
    if (!branch) {
      items.set([]);
      loaded.set(true);
      return;
    }

    loading.set(true);
    error.set(null);
    api.get<ApiPage<T>>(path, { branchId: branch, size: FETCH_SIZE }).subscribe({
      next: (page) => {
        items.set(page?.content ?? []);
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

  // Tracks the branch only: the load itself reads through untracked, so writing
  // the results back cannot retrigger it.
  effect(() => {
    branchId();
    untracked(load);
  });

  return {
    items: items.asReadonly(),
    loading: loading.asReadonly(),
    loaded: loaded.asReadonly(),
    error: error.asReadonly(),
    reload: load,
    create: (body) => api.post<T>(path, withBranch(body, branchId())).pipe(tap(load)),
    update: (id, body) => api.put<T>(`${path}/${id}`, withBranch(body, branchId())).pipe(tap(load)),
    remove: (id) => api.delete<void>(`${path}/${id}`).pipe(tap(load)),
  };
}

/**
 * Every write is for the branch on screen, so the form does not have to carry
 * the id and cannot get it wrong. A body that names one already keeps it.
 */
function withBranch<TWrite>(body: TWrite, branchId: string | null): TWrite {
  if (!branchId || typeof body !== 'object' || body === null) {
    return body;
  }
  const named = body as TWrite & { branchId?: string };
  return named.branchId ? body : { ...named, branchId };
}
