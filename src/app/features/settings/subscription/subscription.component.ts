import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import { money } from '../../../share/data/format';
import { PlanType } from '../../../core/models';

interface UsageRow {
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly unit: string;
}

interface InvoiceRow {
  readonly number: string;
  readonly date: string;
  readonly amount: number;
  readonly status: 'Paid' | 'Due';
}

/** 68-subscription.md — current plan, usage against limits, billing and invoices. */
@Component({
  selector: 'app-subscription-settings',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TableModule,
    SharedModule,
    SettingsSectionComponent,
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionSettingsComponent {
  protected readonly plan = PlanType.Professional;

  protected readonly billingEmail = signal('billing@riverside.edu');
  protected readonly paymentMethod = signal('Visa ending 4242');
  protected readonly billingAddress = signal('128 Riverside Avenue, Phnom Penh');

  protected readonly planFacts = [
    { label: 'Plan', value: 'Professional' },
    { label: 'Billing', value: `${money(249)} / month` },
    { label: 'Renews on', value: '1 October 2026' },
    { label: 'Status', value: 'Active' },
  ];

  protected readonly usage: UsageRow[] = [
    { label: 'Students', used: 342, limit: 500, unit: '' },
    { label: 'Teachers & staff', used: 28, limit: 50, unit: '' },
    { label: 'Branches', used: 5, limit: 5, unit: '' },
    { label: 'Storage', used: 18, limit: 50, unit: ' GB' },
  ];

  protected readonly invoices: InvoiceRow[] = [
    { number: 'INV-2026-009', date: '1 September 2026', amount: 249, status: 'Paid' },
    { number: 'INV-2026-008', date: '1 August 2026', amount: 249, status: 'Paid' },
    { number: 'INV-2026-007', date: '1 July 2026', amount: 249, status: 'Paid' },
    { number: 'INV-2026-006', date: '1 June 2026', amount: 199, status: 'Paid' },
    { number: 'INV-2026-005', date: '1 May 2026', amount: 199, status: 'Paid' },
  ];

  /** At or above this share of a limit the bar shifts colour — the plan is nearly spent. */
  protected readonly nearLimit = 85;

  protected readonly atCapacity = computed(() =>
    this.usage.filter((row) => this.share(row) >= 100).length,
  );

  protected share(row: UsageRow): number {
    return row.limit ? Math.round((row.used / row.limit) * 100) : 0;
  }

  protected level(row: UsageRow): string {
    const share = this.share(row);
    return share >= 100 ? 'is-critical' : share >= this.nearLimit ? 'is-warning' : 'is-ok';
  }

  protected readonly money = money;
}
