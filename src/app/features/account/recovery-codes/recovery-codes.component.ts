import { Component, inject, input, output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

/**
 * The recovery codes, the one time they are shown: each signs in once, in
 * place of a code from the app, for someone whose phone is lost.
 */
@Component({
  selector: 'app-recovery-codes',
  imports: [ButtonModule],
  template: `
    <p class="k-2fa-text">
      Keep these somewhere safe, away from your phone. Each one signs you in once if you lose it.
      They will not be shown again.
    </p>
    <ul class="k-2fa-codes" aria-label="Recovery codes">
      @for (code of codes(); track code) {
        <li><code>{{ code }}</code></li>
      }
    </ul>
    <div class="flex flex-wrap gap-2 justify-content-between mt-3">
      <div class="flex gap-2">
        <p-button label="Copy" icon="pi pi-copy" size="small" severity="secondary" [outlined]="true" (onClick)="copy()" />
        <p-button label="Download" icon="pi pi-download" size="small" severity="secondary" [outlined]="true"
          (onClick)="download()" />
      </div>
      <p-button label="I have saved them" icon="pi pi-check" size="small" (onClick)="saved.emit()" />
    </div>
  `,
})
export class RecoveryCodesComponent {
  private readonly messages = inject(MessageService);

  readonly codes = input.required<string[]>();
  readonly saved = output<void>();

  protected copy(): void {
    navigator.clipboard
      ?.writeText(this.codes().join('\n'))
      .then(() => this.messages.add({ severity: 'success', summary: 'Recovery codes copied', life: 2500 }))
      .catch(() => undefined);
  }

  protected download(): void {
    const text = ['SchoolSuite recovery codes', 'Each code signs in once.', '', ...this.codes(), ''].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    link.download = 'schoolsuite-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
