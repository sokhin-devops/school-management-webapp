import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AcademicYear, Branch, PlanType, School } from '../models';
import { ApiAcademicYear, ApiBranch } from '../api/api.models';
import { ApiClientService } from './api-client.service';
import { describeFailure } from '../api/api-failure';

export interface OnboardingAccount {
  name: string;
  email: string;
}

/** com.school_management_webapi.dto.response.SchoolResponse */
export interface ApiSchool {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

/** com.school_management_webapi.dto.response.OnboardingStatusResponse */
export interface ApiOnboardingStatus {
  completed: boolean;
  steps: { step: string; completed: boolean }[];
}

/**
 * The school-setup wizard, and the calls each step makes.
 *
 * The steps used to be held in memory and thrown away at Done, which left a new
 * school with nothing on the server: every list came back empty and every save
 * failed for want of a branch. Each step now saves as it is completed, so
 * closing the tab half way through keeps what was already entered.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(ApiClientService);

  account?: OnboardingAccount;
  plan?: PlanType;
  school?: Partial<School>;
  branch?: Partial<Branch>;
  academicYear?: Partial<AcademicYear>;

  /** The ids the server assigned, so a later step can refer to them. */
  private readonly _schoolId = signal<string | null>(null);
  private readonly _branchId = signal<string | null>(null);
  readonly schoolId = this._schoolId.asReadonly();
  readonly branchId = this._branchId.asReadonly();

  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  setAccount(account: OnboardingAccount): void {
    this.account = account;
  }

  setPlan(plan: PlanType): void {
    this.plan = plan;
  }

  setSchool(school: Partial<School>): void {
    this.school = school;
  }

  setBranch(branch: Partial<Branch>): void {
    this.branch = branch;
  }

  setAcademicYear(academicYear: Partial<AcademicYear>): void {
    this.academicYear = academicYear;
  }

  /** Where the tenant has got to, so a half-finished setup can be resumed. */
  status(): Observable<ApiOnboardingStatus> {
    return this.api.get<ApiOnboardingStatus>('api/v1/onboarding/status');
  }

  choosePlan(planId: string, billingCycle: 'MONTHLY' | 'YEARLY'): Observable<unknown> {
    return this.track(this.api.post('api/v1/subscriptions', { planId, billingCycle }));
  }

  createSchool(body: {
    name: string;
    type: string;
    email: string;
    phone: string;
    address: string;
  }): Observable<ApiSchool> {
    return this.track(
      this.api
        .post<ApiSchool>('api/v1/onboarding/school', body)
        .pipe(tap((school) => this._schoolId.set(school?.id ?? null))),
    );
  }

  createBranch(body: { name: string; address: string; phone?: string }): Observable<ApiBranch> {
    return this.track(
      this.api
        .post<ApiBranch>('api/v1/onboarding/branch', body)
        .pipe(tap((branch) => this._branchId.set(branch?.id ?? null))),
    );
  }

  createAcademicYear(body: {
    name: string;
    startDate: string;
    endDate: string;
  }): Observable<ApiAcademicYear> {
    return this.track(this.api.post<ApiAcademicYear>('api/v1/onboarding/academic-year', body));
  }

  /** One place to raise and lower the saving flag, so no step can forget. */
  private track<T>(call: Observable<T>): Observable<T> {
    this._saving.set(true);
    this._error.set(null);

    return call.pipe(
      tap({
        next: () => this._saving.set(false),
        error: (failure: unknown) => {
          this._error.set(describeFailure(failure));
          this._saving.set(false);
        },
      }),
    );
  }
}
