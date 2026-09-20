import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

/** One labelled line in a finance card's body, e.g. a date, a method, a payer. */
export interface FinanceCardMeta {
  /** A PrimeIcons name, e.g. `pi-calendar`. */
  readonly icon: string;
  readonly text: string;
  /** Read out in place of the icon, which is decorative. */
  readonly label: string;
}

/**
 * The grid-view card for a fee, a payment or an expense.
 *
 * The shared kit's only card is `k-person-card`, which is person-shaped — it
 * builds initials from the name and types its status input to `Status`, so a
 * payment (PaymentStatus) or an expense (ExpenseStatus) cannot use it at all.
 * This is the same card for a record whose headline is a sum of money: the
 * status tag and the row actions are projected, so the three Finance lists share
 * one card without this component knowing any of their enums.
 */
@Component({
  selector: 'app-finance-record-card',
  imports: [NgClass],
  templateUrl: './finance-record-card.component.html',
  styleUrl: './finance-record-card.component.scss',
})
export class FinanceRecordCardComponent {
  readonly title = input.required<string>();
  /** The line under the title — a category, or the record's reference. */
  readonly subtitle = input<string>('');
  /** Pre-formatted by the page, which owns the currency format. */
  readonly amount = input<string>('');
  readonly meta = input<readonly FinanceCardMeta[]>([]);
}
