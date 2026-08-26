import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { passwordsMatchValidator } from '../../../share/validators/passwords-match.validator';
import { AuthenticationService } from '../../../core/services/authentication.service';

const PASSWORD_STRENGTH_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, PasswordModule, ButtonModule, AuthCardComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthenticationService);

  readonly token = this.route.snapshot.queryParamMap.get('token');

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_STRENGTH_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator('newPassword', 'confirmPassword') },
  );

  submitted = false;
  readonly submitting = signal(false);

  onSubmit(): void {
    if (!this.token) {
      return;
    }

    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.authService.resetPassword({ token: this.token, password: newPassword, confirmPassword }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: 'Your password has been changed successfully.',
        });
        setTimeout(() => this.router.navigateByUrl('/login'), 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Reset failed',
          detail: error.error?.message ?? 'This reset link is invalid or has expired.',
        });
      },
    });
  }
}
