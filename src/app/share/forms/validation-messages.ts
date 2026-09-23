import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

/**
 * Turns one control's errors into a sentence a person can act on.
 *
 * A validator that knows the situation better than this table can say so
 * directly by returning `{ message: '...' }`, so every rule need not be taught
 * here.
 */
export function describeError(errors: ValidationErrors | null, label: string): string {
  if (!errors) {
    return '';
  }
  if (typeof errors['message'] === 'string') {
    return errors['message'];
  }
  if (errors['required']) {
    return `${label} is required.`;
  }
  if (errors['email']) {
    return `${label} must be a valid email address.`;
  }
  if (errors['minlength']) {
    return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
  }
  if (errors['maxlength']) {
    return `${label} must be ${errors['maxlength'].requiredLength} characters or fewer.`;
  }
  if (errors['min']) {
    return `${label} must be ${errors['min'].min} or more.`;
  }
  if (errors['max']) {
    return `${label} must be ${errors['max'].max} or less.`;
  }
  if (errors['pattern']) {
    return `${label} is not in the expected format.`;
  }
  return `${label} is not valid.`;
}

/**
 * Every problem in the form, in the order the fields are declared, so the alert
 * reads down the form the way the eye does.
 *
 * `labels` is the same object the template takes its labels from, so a renamed
 * field cannot end up described by its old name.
 */
export function collectFormErrors(form: FormGroup, labels: Readonly<Record<string, string>>): string[] {
  return Object.entries(form.controls)
    .map(([name, control]) => describeError((control as AbstractControl).errors, labels[name] ?? name))
    .filter((message) => message !== '');
}
