import { Component, effect, inject, model, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { describeFailure } from '../../../core/api/api-failure';
import { TwoFactorService } from '../../../core/services/two-factor.service';
import { readableDate } from '../../../share/data/format';
import { RecoveryCodesComponent } from '../recovery-codes/recovery-codes.component';
import { TwoFactorSetupComponent } from '../two-factor-setup/two-factor-setup.component';

type Mode = 'overview' | 'setup' | 'regenerate' | 'codes' | 'disable';

/** 67-security.md: the signed-in person's own two-factor sign-in, from the account menu. */
@Component({
  selector: 'app-two-factor-dialog',
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    SkeletonModule,
    TagModule,
    RecoveryCodesComponent,
    TwoFactorSetupComponent,
  ],
  templateUrl: './two-factor-dialog.component.html',
})
export class TwoFactorDialogComponent {
  protected readonly twoFactor = inject(TwoFactorService);
  private readonly messages = inject(MessageService);

  readonly visible = model(false);

  protected readonly mode = signal<Mode>('overview');
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codes = signal<string[]>([]);
  protected code = '';
  protected password = '';

  protected readonly since = (value: string | null) => (value ? readableDate(value.slice(0, 10)) : '');

  constructor() {
    // Read fresh each time it opens: a reset by an admin, or a new
    // requirement, changes what this dialog should offer.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      untracked(() => {
        this.show('overview');
        this.loading.set(true);
        this.twoFactor.reload().subscribe({
          next: () => this.loading.set(false),
          error: (failure: unknown) => {
            this.loading.set(false);
            this.error.set(describeFailure(failure));
          },
        });
      });
    });
  }

  protected show(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.code = '';
    this.password = '';
  }

  protected onEnabled(): void {
    this.messages.add({ severity: 'success', summary: 'Two-factor sign-in is on', life: 3000 });
    this.show('overview');
  }

  protected regenerate(): void {
    this.busy.set(true);
    this.twoFactor.regenerateRecoveryCodes(this.code.replace(/\s/g, '')).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.codes.set(result.codes);
        this.show('codes');
      },
      error: (failure: unknown) => this.fail(failure),
    });
  }

  protected disable(): void {
    this.busy.set(true);
    this.twoFactor.disable(this.password, this.code.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.messages.add({ severity: 'success', summary: 'Two-factor sign-in is off', life: 3000 });
        this.show('overview');
      },
      error: (failure: unknown) => this.fail(failure),
    });
  }

  private fail(failure: unknown): void {
    this.busy.set(false);
    this.error.set(describeFailure(failure));
  }
}
