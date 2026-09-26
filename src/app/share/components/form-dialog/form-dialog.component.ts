import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SaveState } from '../../data/save-state';

/**
 * The shell every create/edit form sits in: a titled modal with a scrolling body
 * and a fixed Cancel / Save footer.
 *
 * It does not own the form. The page keeps the FormGroup and decides what Save
 * means; this only reports the intent, so validation rules stay next to the data
 * they belong to.
 *
 * When the page provides a SaveState, the dialog also reflects the request that
 * intent turned into: Save spins while it is in flight, and a refusal is shown
 * above the fields with the draft still in them. The dialog is found by
 * injection rather than by inputs, so none of the forms in between has to pass
 * it along.
 */
@Component({
  selector: 'k-form-dialog',
  imports: [ButtonModule, DialogModule, MessageModule],
  templateUrl: './form-dialog.component.html',
  styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
  private readonly saveState = inject(SaveState, { optional: true });

  readonly visible = model<boolean>(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly saveLabel = input<string>('Save');
  readonly width = input<string>('40rem');

  readonly save = output<void>();
  /** Fired once for every way out — Cancel, the close icon, Escape — because
   * the dialog reports it from onHide rather than from the button. */
  readonly cancel = output<void>();

  protected readonly saving = computed(() => this.saveState?.saving() ?? false);
  protected readonly error = computed(() => this.saveState?.error() ?? null);

  constructor() {
    // A refusal belongs to the attempt it answered. Opening the form again is a
    // new attempt, so it starts clean.
    effect(() => {
      if (this.visible()) {
        untracked(() => this.saveState?.clearError());
      }
    });
  }

  protected onSave(): void {
    if (this.saving()) {
      return;
    }
    this.save.emit();
  }
}
