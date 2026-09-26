import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, finalize } from 'rxjs';
import { describeFailure } from '../../core/api/api-failure';

export interface SaveOptions<T> {
  /** The toast once the server has the record, e.g. "Program saved". */
  readonly success: string;
  /** What to do with the saved record — usually, close the form. */
  readonly done?: (saved: T) => void;
}

/**
 * The state of one page's save: in flight, refused, or neither.
 *
 * Provided per page rather than at the root, so two pages never share a
 * spinner. The form dialog on that page injects the same instance — it sits
 * under the page in the tree — which is how the Save button and the error
 * banner find out about a request the form itself never sees.
 *
 * ```ts
 * @Component({ providers: [SaveState] })
 * export class ProgramComponent {
 *   protected readonly saveState = inject(SaveState);
 *   onSaved(program: Program) {
 *     this.saveState.run(this.programService.save(program), {
 *       success: 'Program saved',
 *       done: () => this.formVisible.set(false),
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class SaveState {
  private readonly messages = inject(MessageService);

  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly saving = this._saving.asReadonly();
  /** Why the server refused the last save, until the form is opened again or resubmitted. */
  readonly error = this._error.asReadonly();

  run<T>(request: Observable<T>, options: SaveOptions<T>): void {
    // A second click while the first is in flight would send the record twice,
    // and on a create that is two records.
    if (this._saving()) {
      return;
    }

    this._saving.set(true);
    this._error.set(null);

    request.pipe(finalize(() => this._saving.set(false))).subscribe({
      next: (saved) => {
        options.done?.(saved);
        this.messages.add({ severity: 'success', summary: options.success, life: 3000 });
      },
      // Kept on the form rather than toasted: the draft is still open behind it,
      // and the reader needs the reason next to the fields they have to change.
      error: (failure: unknown) => this._error.set(describeFailure(failure)),
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}
