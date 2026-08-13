import { Injectable } from '@angular/core';
import { AcademicYear, Branch, PlanType, School } from '../models';

export interface OnboardingAccount {
  name: string;
  email: string;
}

/** Holds sign-up/school-setup data in memory across onboarding steps/routes until Done -> Dashboard. */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  account?: OnboardingAccount;
  plan?: PlanType;
  school?: Partial<School>;
  branch?: Partial<Branch>;
  academicYear?: Partial<AcademicYear>;

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
}
