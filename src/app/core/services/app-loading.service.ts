import { Injectable, computed, signal } from '@angular/core';

/**
 * The one place that decides whether the whole app is busy.
 *
 * Counted rather than flagged: two overlapping tasks that each set a boolean
 * would have the first to finish clear the overlay while the second is still
 * running. A count can only reach zero when everything is genuinely done.
 */
@Injectable({ providedIn: 'root' })
export class AppLoadingService {
  private readonly pending = signal(0);
  private readonly label = signal('');

  readonly busy = computed(() => this.pending() > 0);
  readonly message = this.label.asReadonly();

  /** @returns the function that ends this task. Safe to call more than once. */
  begin(message = ''): () => void {
    if (message) {
      this.label.set(message);
    }
    this.pending.update((count) => count + 1);

    let ended = false;
    return () => {
      if (ended) {
        return;
      }
      ended = true;
      this.pending.update((count) => Math.max(0, count - 1));
      if (this.pending() === 0) {
        this.label.set('');
      }
    };
  }
}
