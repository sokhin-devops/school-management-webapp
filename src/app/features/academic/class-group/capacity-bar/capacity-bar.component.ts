import { Component, computed, input } from '@angular/core';

/**
 * Enrolled against capacity, as a figure with a bar behind it — used in the
 * table cell and on the card, which is why it is a component rather than markup
 * repeated in both templates.
 */
@Component({
  selector: 'app-capacity-bar',
  imports: [],
  templateUrl: './capacity-bar.component.html',
  styleUrl: './capacity-bar.component.scss',
})
export class CapacityBarComponent {
  readonly enrolled = input.required<number>();
  /** Optional on `ClassGroup`: an uncapped class shows the roll and no bar. */
  readonly capacity = input<number>();

  protected readonly label = computed(() => {
    const capacity = this.capacity();
    return capacity ? `${this.enrolled()} / ${capacity}` : `${this.enrolled()}`;
  });

  protected readonly percent = computed(() => {
    const capacity = this.capacity() ?? 0;
    return capacity > 0 ? Math.min(100, Math.round((this.enrolled() / capacity) * 100)) : 0;
  });

  protected readonly warning = computed(() => this.percent() >= 85 && this.percent() < 100);
  protected readonly critical = computed(() => this.percent() >= 100);
}
