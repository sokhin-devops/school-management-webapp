import { Component, computed, inject } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FORM_ERROR_DIALOG_KEY, FormValidationService } from '../../forms';

/**
 * The single dialog that tells someone why a form will not save.
 *
 * Mounted once in the layout rather than once per form: only one form can be
 * open at a time, and one instance keeps the wording and the look identical
 * everywhere without every form having to carry its own copy.
 *
 * It reuses `k-form-dialog`'s head markup and shares its shell rules, so the
 * alert reads as the same kind of object as the form it sits on top of.
 */
@Component({
  selector: 'k-form-error-dialog',
  imports: [ConfirmDialogModule],
  templateUrl: './form-error-dialog.component.html',
})
export class FormErrorDialogComponent {
  protected readonly validation = inject(FormValidationService);
  protected readonly dialogKey = FORM_ERROR_DIALOG_KEY;

  /** The count belongs in the subtitle; the list below says which fields. */
  protected readonly summary = computed(() => {
    const count = this.validation.messages().length;
    // "needs attention", not "needs a value": plenty of these are about a value
    // that is there and wrong — a duplicate code, an amount under the minimum.
    return count === 1
      ? 'One field needs your attention before this can be saved.'
      : `${count} fields need your attention before this can be saved.`;
  });
}
