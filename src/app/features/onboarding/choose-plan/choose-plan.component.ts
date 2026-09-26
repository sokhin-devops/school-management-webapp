import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { PlanType } from '../../../core/models';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { BillingCycle, Plan, SubscriptionService } from '../../../core/services/subscription.service';
import { describeFailure } from '../../../core/api/api-failure';
import { moneyIn } from '../../../share/data/format';

interface PlanCard {
  id: string;
  code: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  limits: string[];
  highlighted: boolean;
}

/**
 * 03-signup-and-onboarding.md: the first step after sign-up.
 *
 * Every card is built from the plans the API sells - price, limits and what is
 * included - because this is where a school commits to one. The copy used to
 * be typed into the component and had drifted from the real prices.
 */
@Component({
  selector: 'app-choose-plan',
  imports: [FormsModule, CardModule, TagModule, ButtonModule, SelectButtonModule, SkeletonModule, AuthCardComponent],
  templateUrl: './choose-plan.component.html',
  styleUrl: './choose-plan.component.scss',
})
export class ChoosePlanComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly onboarding = inject(OnboardingService);
  private readonly subscriptions = inject(SubscriptionService);

  private readonly plans = signal<Plan[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly cycle = signal<BillingCycle>('MONTHLY');
  protected readonly cycleOptions = [
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Yearly', value: 'YEARLY' },
  ];

  /** A plan picked on the marketing site's pricing table, carried through sign-up. */
  private readonly preferred = (this.route.snapshot.queryParamMap.get('plan') ?? '').toLowerCase();

  protected readonly cards = computed<PlanCard[]>(() => {
    const yearly = this.cycle() === 'YEARLY';
    return this.plans().map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      price: moneyIn(yearly ? plan.priceYearly : plan.priceMonthly, plan.currency),
      period: yearly ? '/ year' : '/ month',
      features: (plan.features ?? []).filter((feature) => feature.enabled).map((feature) => feature.name),
      limits: [
        limit(plan.maxStudents, 'student', 'students'),
        limit(plan.maxTeachers, 'teacher', 'teachers'),
        limit(plan.maxBranches, 'branch', 'branches'),
      ],
      // The one they came for, or else the one most schools grow into.
      highlighted: this.preferred ? plan.code.toLowerCase() === this.preferred : plan.code === 'professional',
    }));
  });

  constructor() {
    this.subscriptions.plans().subscribe({
      next: (plans) => {
        this.plans.set(plans ?? []);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(describeFailure(failure));
        this.loading.set(false);
      },
    });
  }

  choosePlan(card: PlanCard): void {
    this.error.set(null);
    this.onboarding.setPlan(toPlanType(card.code));
    // Subscribing is what unlocks the setup steps, so the move only happens once
    // the server has accepted it.
    this.onboarding.choosePlan(card.id, this.cycle()).subscribe({
      next: () => this.router.navigateByUrl('/onboarding/school-setup'),
      error: () => this.error.set(this.onboarding.error() ?? 'That plan could not be selected.'),
    });
  }
}

function limit(value: number | null, one: string, many: string): string {
  return value === null ? `Unlimited ${many}` : `Up to ${value.toLocaleString('en-US')} ${value === 1 ? one : many}`;
}

function toPlanType(code: string): PlanType {
  const match = Object.values(PlanType).find((type) => type.toLowerCase() === code.toLowerCase());
  return (match ?? PlanType.Starter) as PlanType;
}
