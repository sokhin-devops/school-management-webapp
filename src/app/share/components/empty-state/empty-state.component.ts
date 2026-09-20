import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * What a list shows when it has nothing to show. Takes an action through content
 * projection, because "no results" and "nothing created yet" need different ways
 * out — clearing a filter versus creating the first record.
 */
@Component({
  selector: 'k-empty-state',
  imports: [NgClass],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  /** A PrimeIcons name, e.g. `pi-users`. */
  readonly icon = input<string>('pi-inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
