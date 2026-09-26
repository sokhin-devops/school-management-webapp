import { Injectable, inject, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { describeFailure } from '../../core/api/api-failure';

/** Ties every delete in the app to the one confirm dialog mounted in the layout. */
export const CONFIRM_DELETE_DIALOG_KEY = 'k-confirm-delete';

export interface RemovalRequest {
  /** What kind of record, in the singular: "program", "student". */
  readonly noun: string;
  /** Which one — the name the reader knows it by. */
  readonly name: string;
  readonly remove: () => Observable<unknown>;
  /**
   * Said once, plainly, when deleting takes more than the row with it — a class
   * with students in it, a role someone holds. Left out, the dialog says only
   * that the record goes.
   */
  readonly consequence?: string;
  readonly done?: () => void;
}

/**
 * Every delete goes through here: ask, send, then say what happened.
 *
 * Nothing is removed from the list until the server agrees. Every list reloads
 * itself after a write, so a refused delete leaves the row where it was rather
 * than making it vanish and reappear.
 */
@Injectable({ providedIn: 'root' })
export class RecordRemovalService {
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  private readonly _pending = signal<{ header: string; message: string } | null>(null);
  /**
   * What the open dialog is asking. Read by the mounted dialog rather than
   * passed through PrimeNG, which gives its header template no context.
   */
  readonly pending = this._pending.asReadonly();

  confirm(request: RemovalRequest): void {
    const header = `Delete ${request.noun}?`;
    const message = request.consequence
      ? `${request.name} will be deleted. ${request.consequence}`
      : `${request.name} will be deleted.`;
    this._pending.set({ header, message });

    this.confirmation.confirm({
      key: CONFIRM_DELETE_DIALOG_KEY,
      header,
      message,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'danger', size: 'small', icon: 'pi pi-trash' },
      rejectButtonProps: { severity: 'secondary', size: 'small', text: true },
      // Cancel is the button that does no harm, so it is the one Enter presses.
      defaultFocus: 'reject',
      accept: () => this.send(request),
    });
  }

  private send(request: RemovalRequest): void {
    request.remove().subscribe({
      next: () => {
        request.done?.();
        this.messages.add({
          severity: 'success',
          summary: `${capitalise(request.noun)} deleted`,
          detail: request.name,
          life: 3000,
        });
      },
      error: (failure: unknown) =>
        this.messages.add({
          severity: 'error',
          summary: `Could not delete ${request.name}`,
          detail: describeFailure(failure),
          life: 6000,
        }),
    });
  }
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
