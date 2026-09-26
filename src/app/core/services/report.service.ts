import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { describeFailure } from '../api/api-failure';
import { ApiClientService } from './api-client.service';
import { BranchContextService } from './branch-context.service';

/**
 * 50-reports.md: the reporting framework is shared and only the templates
 * differ, so every report's rows live here rather than in four near-identical
 * services.
 */

export interface EnrolmentRow {
  readonly className: string;
  readonly enrolled: number;
  readonly capacity: number;
  readonly active: number;
  readonly inactive: number;
}

export interface AttendanceRow {
  readonly className: string;
  readonly sessions: number;
  readonly present: number;
  readonly absent: number;
  readonly late: number;
}

export interface AcademicRow {
  readonly subject: string;
  readonly assessments: number;
  readonly average: number;
  readonly highest: number;
  readonly lowest: number;
  readonly passRate: number;
}

export interface FinancialRow {
  readonly category: string;
  readonly invoiced: number;
  readonly collected: number;
}

export interface LedgerRow {
  readonly month: string;
  readonly collected: number;
  readonly outstanding: number;
  readonly expenses: number;
}

interface ApiEnrolment {
  rows: { className: string; enrolled: number; capacity: number | null; active: number; inactive: number }[];
}

interface ApiAttendance {
  rows: { className: string; sessions: number; present: number; absent: number; late: number; excused: number }[];
}

interface ApiAcademic {
  rows: {
    subject: string;
    assessments: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    passRate: number | null;
  }[];
}

interface ApiFinancial {
  categories: { category: string; invoiced: number; collected: number }[];
  ledger: { month: string; collected: number; expenses: number }[];
}

/**
 * The four reports, each fetched once per branch.
 *
 * They are separate calls rather than one, because the four pages are reached
 * independently and a reader who opens Financial should not wait on attendance
 * being rolled up.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiClientService);
  private readonly branchContext = inject(BranchContextService);

  private readonly _enrolment = signal<EnrolmentRow[]>([]);
  private readonly _attendance = signal<AttendanceRow[]>([]);
  private readonly _academic = signal<AcademicRow[]>([]);
  private readonly _financial = signal<FinancialRow[]>([]);
  private readonly _ledger = signal<LedgerRow[]>([]);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly enrolment = this._enrolment.asReadonly();
  readonly attendance = this._attendance.asReadonly();
  readonly academic = this._academic.asReadonly();
  readonly financial = this._financial.asReadonly();
  readonly ledger = this._ledger.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly branchId = computed(() => this.branchContext.selectedBranch()?.id ?? null);

  constructor() {
    // Every figure is for one branch, so switching branches reloads rather than
    // leaving the previous school's numbers under a new name.
    effect(() => {
      this.branchId();
      untracked(() => this.reload());
    });
  }

  reload(): void {
    const branchId = this.branchId();
    if (!branchId) {
      this.clear();
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.api.get<ApiEnrolment>('api/v1/reports/enrolment', { branchId }).subscribe({
      next: (report) =>
        this._enrolment.set(
          (report?.rows ?? []).map((row) => ({
            className: row.className,
            enrolled: row.enrolled,
            capacity: row.capacity ?? 0,
            active: row.active,
            inactive: row.inactive,
          })),
        ),
      error: (failure: unknown) => this.fail(failure),
    });

    this.api.get<ApiAttendance>('api/v1/reports/attendance', { branchId }).subscribe({
      next: (report) =>
        this._attendance.set(
          (report?.rows ?? []).map((row) => ({
            className: row.className,
            sessions: row.sessions,
            present: row.present,
            absent: row.absent,
            late: row.late,
          })),
        ),
      error: (failure: unknown) => this.fail(failure),
    });

    this.api.get<ApiAcademic>('api/v1/reports/academic', { branchId }).subscribe({
      next: (report) =>
        this._academic.set(
          (report?.rows ?? []).map((row) => ({
            subject: row.subject,
            assessments: row.assessments,
            // Null means nothing has been marked yet, which the tables show as
            // a zero rather than as a gap in the column.
            average: row.average ?? 0,
            highest: row.highest ?? 0,
            lowest: row.lowest ?? 0,
            passRate: row.passRate ?? 0,
          })),
        ),
      error: (failure: unknown) => this.fail(failure),
    });

    this.api.get<ApiFinancial>('api/v1/reports/financial', { branchId }).subscribe({
      next: (report) => {
        this._financial.set(
          (report?.categories ?? []).map((row) => ({
            category: row.category,
            invoiced: row.invoiced,
            collected: row.collected,
          })),
        );
        this._ledger.set(
          (report?.ledger ?? []).map((row) => ({
            month: row.month,
            collected: row.collected,
            // Nothing issues invoices per student yet, so what is outstanding
            // against a month cannot be counted. Reported as zero rather than
            // as a number the server did not produce.
            outstanding: 0,
            expenses: row.expenses,
          })),
        );
        this._loading.set(false);
      },
      error: (failure: unknown) => this.fail(failure),
    });
  }

  private fail(failure: unknown): void {
    this._error.set(describeFailure(failure));
    this._loading.set(false);
  }

  private clear(): void {
    this._enrolment.set([]);
    this._attendance.set([]);
    this._academic.set([]);
    this._financial.set([]);
    this._ledger.set([]);
  }
}
