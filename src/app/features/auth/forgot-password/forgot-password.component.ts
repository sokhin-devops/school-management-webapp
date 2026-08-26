import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { AuthenticationService } from '../../../core/services/authentication.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, ButtonModule, AuthCardComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthenticationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitted = false;
  readonly submitting = signal(false);
  readonly emailSent = signal(false);
  /** Dev-only: populated when the API is configured to return the reset link directly (no real email delivery yet). */
  readonly devResetUrl = signal<string | null>(null);

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.emailSent.set(true);
        this.devResetUrl.set(response.resetUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong',
          detail: error.error?.message ?? 'Unable to send the reset link. Please try again.',
        });
      },
    });
  }
}
