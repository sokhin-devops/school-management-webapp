import { Injectable, signal } from '@angular/core';
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

  private readonly _revision = signal(0);

  /**
   * Bumps every time the applied theme changes. Anything that paints outside the
   * CSS cascade — canvas charts, for one — can watch this to re-read the design
   * tokens, since a palette swap only rewrites PrimeNG's stylesheet.
   */
  readonly revision = this._revision.asReadonly();

  private readonly presetsMap: Record<string, any> = {
    Aura,
    Material,
    Lara,
    Nora
  };

  /** Lets a settings page pick a mode outright rather than guess the current one. */
  setDarkMode(darkMode: boolean): void {
    if (this.config.darkMode === darkMode) {
      return;
    }
    this.toggleDarkMode();
  }

  toggleDarkMode(): void {
    this.config.darkMode = !this.config.darkMode;
    this.applyDarkMode();
    this.saveConfig();
    this.bump();
  }

  setPreset(presetName: string): void {
    if (this.presetsMap[presetName]) {
      this.config.preset = presetName;
      usePreset(this.presetsMap[presetName]);
      this.applyPrimaryColor();
      this.applySurfaceColor();
      this.saveConfig();
      this.bump();
    }
  }

  setPrimaryColor(colorToken: string): void {
    this.config.primary = colorToken;
    this.applyPrimaryColor();
    this.saveConfig();
    this.bump();
  }

  setSurfaceColor(surfaceToken: string): void {
    this.config.surface = surfaceToken;
    this.applySurfaceColor();
    this.saveConfig();
    this.bump();
  }

  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  // ---------- Internal ----------

  loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
    }
    this.applyTheme();
    this.bump();
  }

  private bump(): void {
    this._revision.update((value) => value + 1);
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
    updatePrimaryPalette(palette(this.config.primary));
  }

  private applySurfaceColor(): void {
    updateSurfacePalette(palette(this.config.surface));
  }
}