import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder,Validators } from '@angular/forms';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-login',
  imports: [RouterLink, KShareModule, AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.router.navigateByUrl('/dashboard');
  }
}
