import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

/** com.school_management_webapi.dto.response.PlanSummaryResponse */
export interface PlanSummary {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxStudents: number | null;
  maxTeachers: number | null;
  maxBranches: number | null;
}

/** com.school_management_webapi.dto.response.PlanResponse - what the plan picker lists. */
export interface Plan extends PlanSummary {
  description: string | null;
  features: { code: string; name: string; enabled: boolean }[];
}

/** com.school_management_webapi.dto.response.SubscriptionResponse */
export interface Subscription {
  id: string;
  plan: PlanSummary;
  billingCycle: BillingCycle;
  status: string;
  startAt: string | null;
  endAt: string | null;
  trialEndAt: string | null;
  canceledAt: string | null;
}

export interface UsageRow {
  key: string;
  label: string;
  used: number;
  /** Null is unlimited. */
  limit: number | null;
}

export interface Usage {
  planName: string | null;
  rows: UsageRow[];
}

export interface BillingDetails {
  billingEmail: string | null;
  billingAddress: string | null;
}

export interface Invoice {
  id: string;
  number: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string | null;
  issuedAt: string;
  billToName: string | null;
  billToEmail: string | null;
  billToAddress: string | null;
}

/** 68-subscription.md: the plan, what it is used for, where it is billed, and what was billed. */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly api = inject(ApiClientService);

  current(): Observable<Subscription> {
    return this.api.get<Subscription>('api/v1/subscriptions/current');
  }

  plans(): Observable<Plan[]> {
    return this.api.get<Plan[]>('api/v1/plans');
  }

  usage(): Observable<Usage> {
    return this.api.get<Usage>('api/v1/subscriptions/current/usage');
  }

  changePlan(planId: string, billingCycle: BillingCycle): Observable<Subscription> {
    return this.api.patch<Subscription>('api/v1/subscriptions/current', { planId, billingCycle });
  }

  cancel(reason: string | null): Observable<unknown> {
    return this.api.post('api/v1/subscriptions/current/cancel', { reason });
  }

  billing(): Observable<BillingDetails> {
    return this.api.get<BillingDetails>('api/v1/subscriptions/billing');
  }

  saveBilling(details: BillingDetails): Observable<BillingDetails> {
    return this.api.put<BillingDetails>('api/v1/subscriptions/billing', details);
  }

  invoices(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('api/v1/subscriptions/invoices');
  }
}
