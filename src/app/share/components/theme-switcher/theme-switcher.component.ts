import { Component, ViewChild } from '@angular/core';
import { Popover } from 'primeng/popover';
import { KShareModule } from '../../k-share.module';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
  imports: [KShareModule]
})
export class ThemeSwitcherComponent {
  @ViewChild('themePopover') themePopover!: Popover;

  presets = ['Aura', 'Material', 'Lara', 'Nora'];

  // More primary colors
  primaryColors = [
    { name: 'Emerald', value: '{emerald}', color: '#10b981' },
    { name: 'Sky', value: '{sky}', color: '#0ea5e9' },
    { name: 'Indigo', value: '{indigo}', color: '#6366f1' },
    { name: 'Rose', value: '{rose}', color: '#f43f5e' },
    { name: 'Amber', value: '{amber}', color: '#f59e0b' },
    { name: 'Lime', value: '{lime}', color: '#84cc16' },
    { name: 'Teal', value: '{teal}', color: '#14b8a6' },
  ];

  surfaceColors = [
    { name: 'Slate', value: '{slate}' },
    { name: 'Gray', value: '{gray}' },
    { name: 'Zinc', value: '{zinc}' },
    { name: 'Neutral', value: '{neutral}' },
    { name: 'Stone', value: '{stone}' },
  ];

  selectedPreset: string;
  selectedPrimary: string;
  selectedSurface: string;
  customColor = '#10b981';

  constructor(public themeService: ThemeService) {
    const cfg = this.themeService.getConfig();
    this.selectedPreset = cfg.preset;
    this.selectedPrimary = cfg.primary;
    this.selectedSurface = cfg.surface;

    // If current primary is a custom hex, keep it in the color picker
    if (cfg.primary.startsWith('#')) {
      this.customColor = cfg.primary;
    }
  }

  togglePopover(event: Event) {
    this.themePopover.toggle(event);
  }

  onPresetChange() {
    this.themeService.setPreset(this.selectedPreset);
  }

  selectPrimary(value: string) {
    this.selectedPrimary = value;
    this.themeService.setPrimaryColor(value);
  }

  selectSurface(value: string) {
    this.selectedSurface = value;
    this.themeService.setSurfaceColor(value);
  }

  applyCustomColor() {
    if (/^#[0-9A-Fa-f]{6}$/.test(this.customColor)) {
      this.selectedPrimary = this.customColor;
      this.themeService.setPrimaryColor(this.customColor);
    }
  }

  isPrimarySelected(value: string): boolean {
    return this.selectedPrimary === value;
  }

  isSurfaceSelected(value: string): boolean {
    return this.selectedSurface === value;
  }
}