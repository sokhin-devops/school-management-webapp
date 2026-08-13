import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder,Validators } from '@angular/forms';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { passwordsMatchValidator } from '../../../share/validators/passwords-match.validator';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-signup',
  imports: [ RouterLink,KShareModule, AuthCardComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator('password', 'confirmPassword') },
  );

  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email } = this.form.getRawValue();
    this.onboarding.setAccount({ name, email });
    this.router.navigateByUrl('/onboarding/plan');
  }
}
