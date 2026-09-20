import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

/**
 * One titled block on a settings or detail page — a heading, an optional line of
 * explanation, the fields, and an optional actions row. Settings pages are a
 * stack of these, which is what keeps every one of them reading the same way.
 *
 * ```html
 * <k-settings-section title="School profile" description="Shown on reports and invoices.">
 *   <div class="k-field">…</div>
 *   <ng-container k-actions><p-button label="Save changes" size="small" /></ng-container>
 * </k-settings-section>
 * ```
 */
@Component({
  selector: 'k-settings-section',
  imports: [CardModule],
  templateUrl: './settings-section.component.html',
  styleUrl: './settings-section.component.scss',
})
export class SettingsSectionComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
