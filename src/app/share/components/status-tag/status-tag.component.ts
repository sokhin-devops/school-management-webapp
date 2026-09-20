import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Status } from '../../../core/models';

/**
 * One place that decides how a `Status` looks, so a record reads the same in
 * every list, card and detail pane across the app.
 *
 * Inactive is neutral rather than red: it is a state a record is allowed to be
 * in, not a failure, and spending the danger colour on it leaves nothing louder
 * for things that are actually wrong.
 */
@Component({
  selector: 'k-status-tag',
  imports: [TagModule],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" styleClass="k-status-tag" />`,
  styleUrl: './status-tag.component.scss',
})
export class StatusTagComponent {
  readonly status = input.required<Status>();

  protected readonly label = computed(() => (this.status() === Status.Active ? 'Active' : 'Inactive'));

  protected readonly severity = computed<'success' | 'secondary'>(() =>
    this.status() === Status.Active ? 'success' : 'secondary',
  );
}
