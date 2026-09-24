import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiDashboardSummary } from '../api/api.models';
import { describeFailure } from '../api/api-failure';
import { ApiClientService } from './api-client.service';
import { BranchContextService } from './branch-context.service';

/**
 * The dashboard's figures, counted by the server.
 *
 * One call rather than a dozen list fetches the client would then have to tally:
 * these are aggregates, and counting them in the database is both faster and the
 * only way they can agree with each other.
 *
 * Reloads on a branch switch, because every number on the page is for one branch.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClientService);
  private readonly branchContext = inject(BranchContextService);

  private readonly _summary = signal<ApiDashboardSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** True once an answer has arrived, so the page can tell empty from not-yet-asked. */
  readonly loaded = computed(() => this._summary() !== null || this._error() !== null);

  constructor() {
    const branchId = computed(() => this.branchContext.selectedBranch()?.id ?? null);

    effect(() => {
      branchId();
      untracked(() => this.reload());
    });
  }

  reload(): void {
    const branchId = this.branchContext.selectedBranch()?.id;
    if (!branchId) {
      this._summary.set(null);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api.get<ApiDashboardSummary>('api/v1/dashboard/summary', { branchId }).subscribe({
      next: (summary) => {
        this._summary.set(summary);
        this._loading.set(false);
      },
      error: (failure: unknown) => {
        this._summary.set(null);
        this._error.set(describeFailure(failure));
        this._loading.set(false);
      },
    });
  }
}
