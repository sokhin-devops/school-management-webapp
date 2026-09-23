import { Component, input, model, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/**
 * The shell every create/edit form sits in: a titled modal with a scrolling body
 * and a fixed Cancel / Save footer.
 *
 * It does not own the form. The page keeps the FormGroup and decides what Save
 * means; this only reports the intent, so validation rules stay next to the data
 * they belong to.
 */
@Component({
  selector: 'k-form-dialog',
  imports: [ButtonModule, DialogModule],
  templateUrl: './form-dialog.component.html',
  styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
  readonly visible = model<boolean>(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly saveLabel = input<string>('Save');
  readonly width = input<string>('40rem');

  readonly save = output<void>();
  /** Fired once for every way out — Cancel, the close icon, Escape — because
   * the dialog reports it from onHide rather than from the button. */
  readonly cancel = output<void>();
}
