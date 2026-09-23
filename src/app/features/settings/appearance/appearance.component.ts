import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SettingsSectionComponent } from '../../../share/components';
import { ThemeService } from '../../../core/services/theme.service';

interface Swatch {
  readonly name: string;
  /** The PrimeNG palette token, e.g. `{emerald}`. */
  readonly token: string;
  /** The 500 step, used for the swatch itself. */
  readonly color: string;
}

const ACCENTS: readonly Swatch[] = [
  { name: 'Emerald', token: '{emerald}', color: '#10b981' },
  { name: 'Teal', token: '{teal}', color: '#14b8a6' },
  { name: 'Cyan', token: '{cyan}', color: '#06b6d4' },
  { name: 'Sky', token: '{sky}', color: '#0ea5e9' },
  { name: 'Blue', token: '{blue}', color: '#3b82f6' },
  { name: 'Indigo', token: '{indigo}', color: '#6366f1' },
  { name: 'Violet', token: '{violet}', color: '#8b5cf6' },
  { name: 'Purple', token: '{purple}', color: '#a855f7' },
  { name: 'Rose', token: '{rose}', color: '#f43f5e' },
  { name: 'Orange', token: '{orange}', color: '#f97316' },
  { name: 'Amber', token: '{amber}', color: '#f59e0b' },
  { name: 'Lime', token: '{lime}', color: '#84cc16' },
];

const SURFACES: Swatch[] = [
  { name: 'Slate', token: '{slate}', color: '#64748b' },
  { name: 'Gray', token: '{gray}', color: '#6b7280' },
  { name: 'Zinc', token: '{zinc}', color: '#71717a' },
  { name: 'Neutral', token: '{neutral}', color: '#737373' },
  { name: 'Stone', token: '{stone}', color: '#78716c' },
];

/**
 * 66-appearance.md — visual preferences, kept apart from business logic.
 *
 * The controls live on the page rather than in the floating theme widget: this
 * is a settings screen, and every other one in Settings is a stack of sections.
 */
@Component({
  selector: 'app-appearance',
  imports: [
    NgClass,
    FormsModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    TagModule,
    TooltipModule,
    SettingsSectionComponent,
  ],
  templateUrl: './appearance.component.html',
  styleUrl: './appearance.component.scss',
})
export class AppearanceComponent {
  private readonly themeService = inject(ThemeService);

  /** `revision` bumps on every applied change, which is what makes this reactive. */
  private readonly config = computed(() => {
    this.themeService.revision();
    return this.themeService.getConfig();
  });

  protected readonly isDark = computed(() => this.config().darkMode);
  protected readonly preset = computed(() => this.config().preset);
  protected readonly accent = computed(() => this.config().primary);
  protected readonly surface = computed(() => this.config().surface);

  protected readonly accents = ACCENTS;
  protected readonly surfaces = SURFACES;

  protected readonly modeOptions = [
    { label: 'Light', value: false, icon: 'pi-sun' },
    { label: 'Dark', value: true, icon: 'pi-moon' },
  ];

  protected readonly presetOptions = [
    { label: 'Aura', value: 'Aura', hint: 'Soft and rounded' },
    { label: 'Material', value: 'Material', hint: 'Bold, elevated' },
    { label: 'Lara', value: 'Lara', hint: 'Balanced and familiar' },
    { label: 'Nora', value: 'Nora', hint: 'Sharp and compact' },
  ];

  protected readonly presetHint = computed(
    () => this.presetOptions.find((option) => option.value === this.preset())?.hint ?? '',
  );

  /** A custom accent is any value that is a hex colour rather than a palette token. */
  protected readonly customAccent = computed(() => {
    const value = this.accent();
    return value.startsWith('#') ? value : '#10b981';
  });

  protected readonly isCustomAccent = computed(() => this.accent().startsWith('#'));

  protected setDarkMode(darkMode: boolean): void {
    this.themeService.setDarkMode(darkMode);
  }

  protected setPreset(preset: string): void {
    this.themeService.setPreset(preset);
  }

  protected setAccent(token: string): void {
    this.themeService.setPrimaryColor(token);
  }

  protected setCustomAccent(value: string): void {
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      this.themeService.setPrimaryColor(value);
    }
  }

  protected setSurface(token: string): void {
    this.themeService.setSurfaceColor(token);
  }
}
