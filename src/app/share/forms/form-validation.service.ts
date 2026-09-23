import { Injectable, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { collectFormErrors } from './validation-messages';

/** Ties every record form to the one confirm dialog mounted in the layout. */
export const FORM_ERROR_DIALOG_KEY = 'k-form-errors';

/**
 * The gate every record form passes through on its way to saving.
 *
 * A form that is not ready says so in one small dialog rather than printing a
 * line of red under each input: the fields themselves already carry the state
 * in colour, and the dialog says what to do about it.
 */
@Injectable({ providedIn: 'root' })
export class FormValidationService {
  private readonly confirmation = inject(ConfirmationService);

  private readonly _messages = signal<readonly string[]>([]);
  /** Read by the mounted dialog; set here so the dialog needs no inputs. */
  readonly messages = this._messages.asReadonly();

  /**
   * True when the form can be saved. When it cannot, every field is marked as
   * touched — which is what turns the labels and borders red — and the dialog
   * lists what is missing.
   */
  check(form: FormGroup, labels: Readonly<Record<string, string>>): boolean {
    if (form.valid) {
      return true;
    }

    form.markAllAsTouched();
    this._messages.set(collectFormErrors(form, labels));

    this.confirmation.confirm({
      key: FORM_ERROR_DIALOG_KEY,
      // There is nothing to confirm, so the dialog keeps one button that only
      // dismisses it; the work stays in the form behind.
      acceptLabel: 'Back to form',
      rejectVisible: false,
      accept: () => this._messages.set([]),
    });

    return false;
  }
}
