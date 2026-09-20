import { Injectable, computed, inject, signal } from '@angular/core';
import { PaymentMethod, PaymentStatus, PlanType, Status } from '../models';
import { OnboardingService } from './onboarding.service';

/** A plan on the pricing table (03-signup-and-onboarding.md) plus the limits it sells. */
export interface SubscriptionPlan {
  type: PlanType;
  name: string;
  monthlyPrice: number;
  description: string;
  studentLimit: number;
  staffLimit: number;
  branchLimit: number;
  storageLimitGb: number;
}

/** The school's live subscription (68-subscription.md). */
export interface SubscriptionRecord {
  plan: SubscriptionPlan;
  status: Status;
  startedOn: Date;
  renewsOn: Date;
}

export interface BillingDetails {
  email: string;
  method: PaymentMethod;
  /** Shown beside the method, e.g. "Visa ending 4242". */
  cardLabel: string;
  address: string;
}

export interface SubscriptionInvoice {
  id: string;
  number: string;
  issuedOn: Date;
  amount: number;
  status: PaymentStatus;
}

/**
 * Prices and headline limits match the cards on the Choose Plan step, so a school
 * sees the same numbers after signing up as it did before.
 *
 * Enterprise is quoted per school rather than listed, so the demo account carries
 * a representative contract price.
 */
const PLANS: readonly SubscriptionPlan[] = [
  {
    type: PlanType.Starter,
    name: 'Starter',
    monthlyPrice: 29,
    description: 'For a single branch just getting started.',
    studentLimit: 200,
    staffLimit: 25,
    branchLimit: 1,
    storageLimitGb: 20,
  },
  {
    type: PlanType.Professional,
    name: 'Professional',
    monthlyPrice: 79,
    description: 'For growing schools with multiple branches.',
    studentLimit: 1000,
    staffLimit: 120,
    branchLimit: 5,
    storageLimitGb: 100,
  },
  {
    type: PlanType.Enterprise,
    name: 'Enterprise',
    monthlyPrice: 249,
    description: 'For large institutions and school networks.',
    studentLimit: 10000,
    staffLimit: 1000,
    branchLimit: 50,
    storageLimitGb: 1000,
  },
];

function planFor(type: PlanType): SubscriptionPlan {
  return PLANS.find((plan) => plan.type === type) ?? PLANS[1];
}

function seedSubscription(type: PlanType): SubscriptionRecord {
  const today = new Date();

  return {
    plan: planFor(type),
    status: Status.Active,
    startedOn: new Date(today.getFullYear() - 1, today.getMonth(), 1),
    renewsOn: new Date(today.getFullYear(), today.getMonth() + 1, 1),
  };
}

function seedBilling(): BillingDetails {
  return {
    email: 'accounts@riverside.edu',
    method: PaymentMethod.Card,
    cardLabel: 'Visa ending 4242',
    address: '128 Riverside Avenue\nPhnom Penh, Cambodia',
  };
}

/**
 * One invoice per month back to the start of the subscription. The current month
 * is still open, and the history keeps the one failed charge that was re-run and
 * the one refund, so the status column has something to show.
 */
function seedInvoices(price: number): SubscriptionInvoice[] {
  const today = new Date();
  const exceptions = new Map<number, PaymentStatus>([
    [0, PaymentStatus.Pending],
    [5, PaymentStatus.Failed],
    [9, PaymentStatus.Refunded],
  ]);

  return Array.from({ length: 12 }, (_unused, monthsAgo) => {
    const issuedOn = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const sequence = 12 - monthsAgo;

    return {
      id: `inv-${sequence}`,
      number: `INV-${issuedOn.getFullYear()}-${String(sequence).padStart(4, '0')}`,
      issuedOn,
      amount: price,
      status: exceptions.get(monthsAgo) ?? PaymentStatus.Paid,
    };
  });
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly onboarding = inject(OnboardingService);

  private readonly _subscription = signal<SubscriptionRecord>(
    seedSubscription(this.onboarding.plan ?? PlanType.Professional),
  );
  private readonly _billing = signal<BillingDetails>(seedBilling());
  private readonly _invoices = signal<SubscriptionInvoice[]>(
    seedInvoices(planFor(this.onboarding.plan ?? PlanType.Professional).monthlyPrice),
  );
  /** No file store behind the mock, so stored media is the one usage figure that is quoted. */
  private readonly _storageUsedGb = signal(18.6);

  readonly subscription = this._subscription.asReadonly();
  readonly billing = this._billing.asReadonly();
  readonly invoices = this._invoices.asReadonly();
  readonly storageUsedGb = this._storageUsedGb.asReadonly();
  readonly plans = PLANS;

  readonly plan = computed(() => this._subscription().plan);
}
