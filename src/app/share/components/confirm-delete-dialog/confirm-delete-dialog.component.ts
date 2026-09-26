import { Component, inject } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CONFIRM_DELETE_DIALOG_KEY, RecordRemovalService } from '../../data/record-removal.service';

/**
 * The single dialog every delete in the app asks through.
 *
 * Mounted once in the layout, beside the form-error dialog, and for the same
 * reason: one instance keeps the wording and the look identical everywhere, and
 * no page has to remember to carry its own.
 */
@Component({
  selector: 'k-confirm-delete-dialog',
  imports: [ConfirmDialogModule],
  templateUrl: './confirm-delete-dialog.component.html',
})
export class ConfirmDeleteDialogComponent {
  protected readonly removal = inject(RecordRemovalService);
  protected readonly dialogKey = CONFIRM_DELETE_DIALOG_KEY;
}
