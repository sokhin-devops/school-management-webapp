import { Injectable } from '@angular/core';
import { usePreset, updatePrimaryPalette, updateSurfacePalette, palette } from '@primeng/themes';

import Material from '@primeng/themes/material';
import Lara from '@primeng/themes/lara';
import Nora from '@primeng/themes/nora';
import Aura from '@primeng/themes/aura';

export interface ThemeConfig {
  darkMode: boolean;
  preset: string;
  primary: string;
  surface: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly configKey = 'primeng-theme-config';

  private config: ThemeConfig = {
    darkMode: false,
    preset: 'Aura',
    primary: '{emerald}',
    surface: '{slate}'
  };

  private readonly presetsMap: Record<string, any> = {
    Aura,
    Material,
    Lara,
    Nora
  };

  constructor() {
    this.loadConfig();
  }

  toggleDarkMode(): void {
    this.config.darkMode = !this.config.darkMode;
    this.applyDarkMode();
    this.saveConfig();
  }

  setPreset(presetName: string): void {
    if (this.presetsMap[presetName]) {
      this.config.preset = presetName;
      usePreset(this.presetsMap[presetName]);
      this.applyPrimaryColor();
      this.applySurfaceColor();
      this.saveConfig();
    }
  }

  setPrimaryColor(colorToken: string): void {
    this.config.primary = colorToken;
    this.applyPrimaryColor();
    this.saveConfig();
  }

  setSurfaceColor(surfaceToken: string): void {
    this.config.surface = surfaceToken;
    this.applySurfaceColor();
    this.saveConfig();
  }

  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  // ---------- Internal ----------

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // ignore corrupted data
    }
    this.applyTheme();
  }

  private saveConfig(): void {
    localStorage.setItem(this.configKey, JSON.stringify(this.config));
  }

  private applyTheme(): void {
    if (this.presetsMap[this.config.preset]) {
      usePreset(this.presetsMap[this.config.preset]);
    }
    this.applyPrimaryColor();
    this.applySurfaceColor();
    this.applyDarkMode();
  }

  private applyDarkMode(): void {
    const root = document.documentElement;
    if (this.config.darkMode) {
      root.classList.add('app-dark');
    } else {
      root.classList.remove('app-dark');
    }
  }

  private applyPrimaryColor(): void {
    // palette() works with both '{sky}' tokens and hex colors
    updatePrimaryPalette(palette(this.config.primary));
  }

  private applySurfaceColor(): void {
    updateSurfacePalette(palette(this.config.surface));
  }
}