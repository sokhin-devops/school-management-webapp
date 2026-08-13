import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { passwordsMatchValidator } from '../../../share/validators/passwords-match.validator';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, PasswordModule, ButtonModule, AuthCardComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator('newPassword', 'confirmPassword') },
  );

  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Password Updated',
      detail: 'Your password has been changed successfully.',
    });
    setTimeout(() => this.router.navigateByUrl('/login'), 1500);
  }
}
