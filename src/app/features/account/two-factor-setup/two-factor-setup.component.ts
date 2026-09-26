import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { describeFailure } from '../../../core/api/api-failure';
import { TwoFactorService } from '../../../core/services/two-factor.service';
import { RecoveryCodesComponent } from '../recovery-codes/recovery-codes.component';

type Stage = 'loading' | 'scan' | 'codes' | 'failed';

/**
 * Setting up two-factor: scan, confirm with a code, keep the recovery codes.
 * Two-factor is only switched on by the confirming code, so a phone that never
 * scanned the QR code cannot lock anyone out. Used by the account dialog and
 * by the page a school's requirement sends people to.
 */
@Component({
  selector: 'app-two-factor-setup',
  imports: [FormsModule, ButtonModule, InputTextModule, MessageModule, SkeletonModule, RecoveryCodesComponent],
  templateUrl: './two-factor-setup.component.html',
})
export class TwoFactorSetupComponent implements OnInit {
  private readonly twoFactor = inject(TwoFactorService);

  /** Fired once the recovery codes have been put away. */
  readonly done = output<void>();

  protected readonly stage = signal<Stage>('loading');
  protected readonly secret = signal('');
  protected readonly qr = signal<string | null>(null);
  protected readonly codes = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected code = '';

  /** In fours, the way the apps ask for it to be typed. */
  protected readonly groupedSecret = computed(() => this.secret().replace(/(.{4})/g, '$1 ').trim());

  ngOnInit(): void {
    this.start();
  }

  protected start(): void {
    this.stage.set('loading');
    this.error.set(null);
    this.twoFactor.beginSetup().subscribe({
      next: (setup) => {
        this.secret.set(setup.secret);
        this.stage.set('scan');
        this.drawQr(setup.otpauthUri);
      },
      error: (failure: unknown) => {
        this.error.set(describeFailure(failure));
        this.stage.set('failed');
      },
    });
  }

  protected confirm(): void {
    const code = this.code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      this.error.set('Enter the six digits your app shows.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.twoFactor.enable(code).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.codes.set(result.codes);
        this.stage.set('codes');
      },
      error: (failure: unknown) => {
        this.busy.set(false);
        this.error.set(describeFailure(failure));
      },
    });
  }

  /** Loaded only here: nobody else needs a QR encoder, and the first page should not carry one. */
  private drawQr(uri: string): void {
    import('qrcode')
      .then((module) => {
        const encoder = (module as unknown as { default?: typeof module }).default ?? module;
        return encoder.toDataURL(uri, { margin: 1, width: 184, errorCorrectionLevel: 'M' });
      })
      .then((url) => this.qr.set(url))
      // The key below the image still works without it.
      .catch(() => this.qr.set(null));
  }
}
