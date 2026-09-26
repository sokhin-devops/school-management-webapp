import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { TwoFactorService } from '../../../core/services/two-factor.service';
import { TwoFactorSetupComponent } from '../two-factor-setup/two-factor-setup.component';

/**
 * 67-security.md: where a school that requires two-factor sends anyone who
 * has not set it up. Outside the layout, since the layout's own data is what
 * the API holds back until this is done.
 */
@Component({
  selector: 'app-two-factor-page',
  imports: [ButtonModule, AuthCardComponent, TwoFactorSetupComponent],
  template: `
    <app-auth-card title="Set up two-factor sign-in"
      subtitle="Your school requires a code from an authenticator app at sign-in. It takes a minute."
      maxWidth="560px">
      <app-two-factor-setup (done)="continue()" />
      <div class="flex justify-content-center mt-4">
        <p-button label="Sign out" icon="pi pi-sign-out" size="small" severity="secondary" [text]="true"
          (onClick)="auth.logout()" />
      </div>
    </app-auth-card>
  `,
})
export class TwoFactorPageComponent {
  protected readonly auth = inject(AuthenticationService);
  private readonly twoFactor = inject(TwoFactorService);
  private readonly router = inject(Router);

  protected continue(): void {
    // The guard reads the status; it has to see "on" before it lets them in.
    this.twoFactor.reload().subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => this.router.navigateByUrl('/dashboard'),
    });
  }
}
