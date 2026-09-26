import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { KShareModule } from '../../../share/k-share.module';
import { AuthenticationService } from '../../../core/services/authentication.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, KShareModule, AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthenticationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitted = false;
  readonly submitting = signal(false);

  /**
   * 67-security.md: set once the password was right for an account with
   * two-factor on; the page then asks for the code instead.
   */
  readonly challenge = signal<string | null>(null);
  readonly codeError = signal<string | null>(null);
  code = '';

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (auth) => {
        if (auth.twoFactorToken) {
          this.submitting.set(false);
          this.code = '';
          this.codeError.set(null);
          this.challenge.set(auth.twoFactorToken);
          return;
        }
        this.enter();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Login failed',
          detail: error.error?.message ?? 'Invalid email or password.',
        });
      },
    });
  }

  onVerify(): void {
    const challenge = this.challenge();
    const code = this.code.trim();
    if (!challenge) {
      return;
    }
    if (!code) {
      this.codeError.set('Enter the code from your app.');
      return;
    }

    this.submitting.set(true);
    this.codeError.set(null);
    this.authService.completeTwoFactor(challenge, code).subscribe({
      next: () => this.enter(),
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        const reason = error.error?.errorCode;
        // An expired or exhausted challenge cannot be retried; the password step can.
        if (reason === 'TWO_FACTOR_LOCKED' || (error.status === 401 && reason !== 'INVALID_TWO_FACTOR_CODE')) {
          this.backToPassword();
          this.messageService.add({ severity: 'error', summary: 'Sign in again', detail: error.error?.message });
          return;
        }
        this.codeError.set(error.error?.message ?? 'That code is not right.');
      },
    });
  }

  backToPassword(): void {
    this.challenge.set(null);
    this.code = '';
    this.form.controls.password.reset('');
    this.submitted = false;
  }

  private enter(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }
}
