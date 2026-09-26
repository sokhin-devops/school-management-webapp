import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Branch } from '../models';
import { ApiBranch } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { ApiClientService } from './api-client.service';
import { describeFailure } from '../api/api-failure';
import { AppLoadingService } from './app-loading.service';

const SELECTED_BRANCH_KEY = 'sm_selected_branch';

/**
 * The branch every screen is showing (06-topbar.md).
 *
 * Loaded from the API rather than seeded, because the branch id is what every
 * other request is scoped by — an invented one would make every list empty and
 * every save fail.
 *
 * The choice is remembered per device: coming back to a different branch than
 * you left is disorienting, and the id is not a secret.
 */
@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private readonly api = inject(ApiClientService);
  private readonly appLoading = inject(AppLoadingService);

  private readonly _branches = signal<Branch[]>([]);
  private readonly _selectedBranchId = signal<string | null>(readRemembered());
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly branches = this._branches.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  /** Null until the branches are loaded, or if the tenant has none yet. */
  readonly selectedBranch = computed<Branch | null>(() => {
    const branches = this._branches();
    if (branches.length === 0) {
      return null;
    }
    return branches.find((branch) => branch.id === this._selectedBranchId()) ?? branches[0];
  });

  /**
   * Loads once. Called from the authenticated shell rather than on injection,
   * because this needs a session and the service is created before there is one.
   */
  ensureLoaded(): void {
    if (this._loaded() || this._loading()) {
      return;
    }
    this.reload();
  }

  reload(): void {
    this._loading.set(true);
    this._error.set(null);

    // Only the very first load takes the whole screen. Every page under the
    // shell is scoped by the branch, so until this lands there is nothing any of
    // them could truthfully show. A later refresh happens underneath them.
    const done = this._loaded() ? () => undefined : this.appLoading.begin('Loading your school');

    this.api.get<ApiBranch[]>('api/v1/branches').subscribe({
      next: (branches) => {
        const rows = (branches ?? []).map(toBranch);
        this._branches.set(rows);

        // A remembered branch that no longer exists silently falls back to the
        // first one, rather than leaving every list scoped to nothing.
        const remembered = this._selectedBranchId();
        if (!remembered || !rows.some((branch) => branch.id === remembered)) {
          this.selectBranch(rows[0]?.id ?? null);
        }

        this._loading.set(false);
        this._loaded.set(true);
        done();
      },
      error: (failure: unknown) => {
        this._branches.set([]);
        this._error.set(describeFailure(failure));
        this._loading.set(false);
        this._loaded.set(true);
        done();
      },
    });
  }

  /**
   * Creates or updates a branch, then reloads the list — which is also the
   * topbar's switcher, so a new branch is choosable the moment it exists.
   */
  save(branch: Branch): Observable<ApiBranch> {
    const body = {
      schoolId: branch.schoolId,
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone || null,
      mainBranch: branch.mainBranch ?? false,
      status: fromStatus(branch.status),
    };
    const request = branch.id
      ? this.api.put<ApiBranch>(`api/v1/branches/${branch.id}`, body)
      : this.api.post<ApiBranch>('api/v1/branches', body);
    return request.pipe(tap(() => this.reload()));
  }

  /**
   * The server promotes another branch if this was the main one, and refuses
   * to delete the last; the reload shows whichever it did.
   */
  remove(id: string): Observable<void> {
    return this.api.delete<void>(`api/v1/branches/${id}`).pipe(tap(() => this.reload()));
  }

  selectBranch(branchId: string | null): void {
    this._selectedBranchId.set(branchId);
    remember(branchId);
  }
}

function toBranch(branch: ApiBranch): Branch {
  return {
    id: branch.id,
    schoolId: branch.schoolId,
    name: branch.name,
    address: branch.address,
    phone: branch.phone ?? undefined,
    mainBranch: branch.mainBranch,
    status: toStatus(branch.status),
  };
}

/** Both wrapped: storage throws in a private window rather than returning null. */
function readRemembered(): string | null {
  try {
    return localStorage.getItem(SELECTED_BRANCH_KEY);
  } catch {
    return null;
  }
}

function remember(branchId: string | null): void {
  try {
    if (branchId) {
      localStorage.setItem(SELECTED_BRANCH_KEY, branchId);
    } else {
      localStorage.removeItem(SELECTED_BRANCH_KEY);
    }
  } catch {
    // A device that will not remember the choice still works; it just forgets.
  }
}
