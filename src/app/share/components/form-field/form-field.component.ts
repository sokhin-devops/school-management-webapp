import { Component, input } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';

/**
 * Label, required marker and control for one form field.
 *
 * The field states the problem in colour only — a red label and a red border.
 * What is actually wrong is said once, in the dialog's alert, so a long form
 * does not grow a paragraph of red text between every pair of inputs.
 *
 * The control itself is projected, so this works with any input PrimeNG offers
 * without wrapping each one.
 */
@Component({
  selector: 'k-form-field',
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  /** Ties the label to the projected input; the page sets the same id on it. */
  readonly inputId = input<string>('');
  readonly hint = input<string>('');

  /**
   * Read as getters rather than signals: a reactive form's status is not a
   * signal, and these re-evaluate on the same change detection pass that
   * updates the control.
   */
  protected get isRequired(): boolean {
    return this.control().hasValidator(Validators.required);
  }

  /** True once the required part is satisfied — the asterisk stops being red. */
  protected get isMet(): boolean {
    return !this.control().hasError('required');
  }

  /** Stays quiet until the field has been used or a save was attempted. */
  protected get isInvalid(): boolean {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  }
}
