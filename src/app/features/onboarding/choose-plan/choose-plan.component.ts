import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { PlanType } from '../../../core/models';
import { OnboardingService } from '../../../core/services/onboarding.service';

interface PlanOption {
  type: PlanType;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

@Component({
  selector: 'app-choose-plan',
  imports: [CardModule, TagModule, ButtonModule, AuthCardComponent],
  templateUrl: './choose-plan.component.html',
  styleUrl: './choose-plan.component.scss',
})
export class ChoosePlanComponent {
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

  readonly plans: PlanOption[] = [
    {
      type: PlanType.Starter,
      name: 'Starter',
      price: '$29',
      period: '/ month',
      description: 'For a single branch just getting started.',
      features: ['1 branch', 'Up to 200 students', 'Core academic & attendance modules'],
    },
    {
      type: PlanType.Professional,
      name: 'Professional',
      price: '$79',
      period: '/ month',
      description: 'For growing schools with multiple branches.',
      features: ['Up to 5 branches', 'Up to 1,000 students', 'Finance & reporting'],
      highlighted: true,
    },
    {
      type: PlanType.Enterprise,
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large institutions and school networks.',
      features: ['Unlimited branches', 'Unlimited students', 'Priority support'],
    },
  ];

  choosePlan(plan: PlanType): void {
    this.onboarding.setPlan(plan);
    this.router.navigateByUrl('/onboarding/school-setup');
  }
}
