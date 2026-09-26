import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { FEATURE_NAMES } from '../../../core/services/permission.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, SharedModule } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import { CanDirective } from '../../../share/directives/can.directive';
import { humanize, moneyIn, readableDate } from '../../../share/data/format';
import {
  BillingCycle,
  Invoice,
  Plan,
  Subscription,
  SubscriptionService,
  Usage,
  UsageRow,
} from '../../../core/services/subscription.service';
import { describeFailure } from '../../../core/api/api-failure';

/** 68-subscription.md — current plan, usage against limits, billing and invoices. */
@Component({
  selector: 'app-subscription-settings',
  imports: [
    CanDirective,
    DatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SelectButtonModule,
    SkeletonModule,
    TagModule,
    TableModule,
    TextareaModule,
    TooltipModule,
    SharedModule,
    SettingsSectionComponent,
  ],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionSettingsComponent {
  private readonly subscriptions = inject(SubscriptionService);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);

  /** Set when a page the plan does not include sent the reader here. */
  private readonly wantedFeature = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('feature'))), {
    initialValue: null,
  });

  /** "Finance is not part of Starter. It is included in Professional and Enterprise." */
  protected readonly featureNote = computed(() => {
    const code = this.wantedFeature();
    if (!code) {
      return null;
    }
    const name = FEATURE_NAMES[code] ?? code;
    const current = this.subscription()?.plan.name;
    const including = this.plans()
      .filter((plan) => plan.features?.some((feature) => feature.code === code && feature.enabled))
      .map((plan) => plan.name);
    const where = including.length
      ? `It is included in ${including.length > 1 ? including.slice(0, -1).join(', ') + ' and ' + including[including.length - 1] : including[0]}.`
      : '';
    return `${name} is not part of ${current ? `the ${current} plan` : 'your plan'}. ${where}`.trim();
  });

  protected readonly subscription = signal<Subscription | null>(null);
  protected readonly subscriptionError = signal<string | null>(null);
  protected readonly usage = signal<Usage | null>(null);
  protected readonly invoices = signal<Invoice[] | null>(null);
  protected readonly plans = signal<Plan[]>([]);

  protected readonly billingEmail = signal('');
  protected readonly billingAddress = signal('');
  protected readonly savingBilling = signal(false);

  protected readonly changeVisible = signal(false);
  protected readonly chosenPlanId = signal<string | null>(null);
  protected readonly chosenCycle = signal<BillingCycle>('MONTHLY');
  protected readonly changing = signal(false);

  protected readonly cancelVisible = signal(false);
  protected readonly cancelReason = signal('');
  protected readonly canceling = signal(false);

  protected readonly cycleOptions = [
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Yearly', value: 'YEARLY' },
  ];

  /** At or above this share of a limit the bar shifts colour — the plan is nearly spent. */
  protected readonly nearLimit = 85;

  protected readonly live = computed(() => {
    const status = this.subscription()?.status;
    return status === 'ACTIVE' || status === 'TRIALING' || status === 'TRIAL';
  });

  protected readonly planFacts = computed(() => {
    const subscription = this.subscription();
    if (!subscription) {
      return [];
    }
    const plan = subscription.plan;
    const yearly = subscription.billingCycle === 'YEARLY';
    const price = yearly ? plan.priceYearly : plan.priceMonthly;
    return [
      { label: 'Plan', value: plan.name },
      { label: 'Billing', value: `${moneyIn(price, plan.currency)} / ${yearly ? 'year' : 'month'}` },
      {
        label: subscription.status === 'CANCELED' ? 'Ends on' : 'Renews on',
        value: subscription.endAt ? readableDate(subscription.endAt) : '—',
      },
      { label: 'Status', value: humanize(subscription.status.toLowerCase()) },
    ];
  });

  protected readonly atCapacity = computed(
    () => (this.usage()?.rows ?? []).filter((row) => row.limit !== null && this.share(row) >= 100).length,
  );

  protected readonly chosenPlan = computed(() => this.plans().find((plan) => plan.id === this.chosenPlanId()) ?? null);
  protected readonly changeIsNoop = computed(() => {
    const current = this.subscription();
    return !!current && current.plan.id === this.chosenPlanId() && current.billingCycle === this.chosenCycle();
  });

  constructor() {
    this.load();
    // Loaded up front, not only for the plan picker: the note about a missing
    // feature names the plans that have it.
    this.subscriptions.plans().subscribe({ next: (plans) => this.plans.set(plans ?? []), error: () => undefined });
  }

  protected load(): void {
    this.subscriptionError.set(null);
    this.subscriptions.current().subscribe({
      next: (subscription) => this.subscription.set(subscription),
      error: (failure: unknown) => this.subscriptionError.set(describeFailure(failure)),
    });
    this.subscriptions.usage().subscribe({ next: (usage) => this.usage.set(usage), error: () => undefined });
    this.subscriptions.invoices().subscribe({
      next: (invoices) => this.invoices.set(invoices ?? []),
      error: () => this.invoices.set([]),
    });
    this.subscriptions.billing().subscribe({
      next: (billing) => {
        this.billingEmail.set(billing?.billingEmail ?? '');
        this.billingAddress.set(billing?.billingAddress ?? '');
      },
      error: () => undefined,
    });
  }

  protected share(row: UsageRow): number {
    return row.limit ? Math.round((row.used / row.limit) * 100) : 0;
  }

  protected level(row: UsageRow): string {
    const share = this.share(row);
    return share >= 100 ? 'is-critical' : share >= this.nearLimit ? 'is-warning' : 'is-ok';
  }

  protected price(plan: Plan, cycle: BillingCycle): string {
    return `${moneyIn(cycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly, plan.currency)} / ${cycle === 'YEARLY' ? 'year' : 'month'}`;
  }

  protected limit(value: number | null, noun: string): string {
    return value === null ? `Unlimited ${noun}` : `Up to ${value} ${noun}`;
  }

  protected money(invoice: Invoice): string {
    return moneyIn(invoice.amount, invoice.currency);
  }

  // --- change plan ------------------------------------------------------------

  protected openChange(): void {
    const current = this.subscription();
    this.chosenPlanId.set(current?.plan.id ?? null);
    this.chosenCycle.set(current?.billingCycle ?? 'MONTHLY');
    this.changeVisible.set(true);
    if (!this.plans().length) {
      this.subscriptions.plans().subscribe({ next: (plans) => this.plans.set(plans ?? []), error: () => undefined });
    }
  }

  protected confirmChange(): void {
    const planId = this.chosenPlanId();
    if (!planId || this.changing() || this.changeIsNoop()) {
      return;
    }
    this.changing.set(true);
    this.subscriptions.changePlan(planId, this.chosenCycle()).subscribe({
      next: (subscription) => {
        this.changing.set(false);
        this.changeVisible.set(false);
        this.subscription.set(subscription);
        this.messages.add({ severity: 'success', summary: `You are now on ${subscription.plan.name}`, life: 4000 });
        this.load();
      },
      error: (failure: unknown) => {
        this.changing.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not change plan', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  // --- cancel ------------------------------------------------------------------

  protected openCancel(): void {
    this.cancelReason.set('');
    this.cancelVisible.set(true);
  }

  protected confirmCancel(): void {
    if (this.canceling()) {
      return;
    }
    this.canceling.set(true);
    this.subscriptions.cancel(this.cancelReason().trim() || null).subscribe({
      next: () => {
        this.canceling.set(false);
        this.cancelVisible.set(false);
        this.messages.add({ severity: 'warn', summary: 'Your plan has been cancelled', life: 5000 });
        this.load();
      },
      error: (failure: unknown) => {
        this.canceling.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not cancel', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  // --- billing -----------------------------------------------------------------

  protected saveBilling(): void {
    if (!this.billingEmail().trim()) {
      this.messages.add({ severity: 'warn', summary: 'A billing email is required', life: 4000 });
      return;
    }
    this.savingBilling.set(true);
    this.subscriptions
      .saveBilling({ billingEmail: this.billingEmail().trim(), billingAddress: this.billingAddress().trim() || null })
      .subscribe({
        next: () => {
          this.savingBilling.set(false);
          this.messages.add({ severity: 'success', summary: 'Billing details saved', detail: 'New invoices will use them.', life: 3000 });
        },
        error: (failure: unknown) => {
          this.savingBilling.set(false);
          this.messages.add({ severity: 'error', summary: 'Could not save', detail: describeFailure(failure), life: 6000 });
        },
      });
  }

  // --- invoices ----------------------------------------------------------------

  /**
   * Opens the invoice as a printable page. Built here rather than on the
   * server: it is the same data the table shows, laid out for paper, and the
   * browser's print dialog saves it as a PDF.
   */
  protected printInvoice(invoice: Invoice): void {
    const page = window.open('', '_blank', 'width=820,height=960');
    if (!page) {
      this.messages.add({ severity: 'warn', summary: 'Allow pop-ups to open the invoice', life: 5000 });
      return;
    }
    const escape = (value: string | null | undefined) =>
      (value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const period = `${readableDate(invoice.periodStart)}${invoice.periodEnd ? ' – ' + readableDate(invoice.periodEnd) : ''}`;
    page.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(invoice.number)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; color: #1f2937; margin: 48px; }
  h1 { font-size: 22px; margin: 0 0 4px; } .muted { color: #6b7280; }
  .head { display: flex; justify-content: space-between; margin-bottom: 40px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
  th:last-child, td:last-child { text-align: right; } .total td { font-weight: 700; border-bottom: 0; }
  @media print { body { margin: 24px; } }
</style></head><body>
<div class="head"><div><h1>Invoice</h1><div class="muted">${escape(invoice.number)}</div></div>
<div style="text-align:right"><div>Issued ${escape(readableDate(invoice.issuedAt))}</div></div></div>
<div class="muted">Billed to</div>
<div><strong>${escape(invoice.billToName)}</strong></div>
<div>${escape(invoice.billToEmail)}</div>
<div style="white-space:pre-line">${escape(invoice.billToAddress)}</div>
<table><thead><tr><th>Description</th><th>Period</th><th>Amount</th></tr></thead>
<tbody><tr><td>${escape(invoice.planName)} plan, billed ${invoice.billingCycle === 'YEARLY' ? 'yearly' : 'monthly'}</td>
<td>${escape(period)}</td><td>${escape(this.money(invoice))}</td></tr>
<tr class="total"><td></td><td>Total</td><td>${escape(this.money(invoice))}</td></tr></tbody></table>
<script>window.onload = () => window.print();</script>
</body></html>`);
    page.document.close();
  }
}
