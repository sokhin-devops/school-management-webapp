import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder,Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { passwordsMatchValidator } from '../../../share/validators/passwords-match.validator';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { KShareModule } from '../../../share/k-share.module';

const PASSWORD_STRENGTH_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

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
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthenticationService);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_STRENGTH_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator('password', 'confirmPassword') },
  );

  submitted = false;
  readonly submitting = signal(false);

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, confirmPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.authService.register({ name, email, password, confirmPassword }).subscribe({
      next: () => {
        this.onboarding.setAccount({ name, email });
        this.router.navigateByUrl('/onboarding/plan');
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Sign up failed',
          detail: error.error?.message ?? 'Unable to create your account. Please try again.',
        });
      },
    });
  }
}
