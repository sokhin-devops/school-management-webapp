import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Cross-field validator: fails with `passwordsMismatch` unless both controls hold equal values. */
export function passwordsMatchValidator(passwordKey: string, confirmPasswordKey: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmPasswordKey)?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  };
}
