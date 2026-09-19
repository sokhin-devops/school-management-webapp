import { Injectable, effect, inject, signal } from '@angular/core';
import { ThemeService } from './theme.service';

export interface ChartStatusColors {
  readonly good: string;
  readonly warning: string;
  readonly serious: string;
  readonly critical: string;
}

export interface ChartTheme {
  /** True while the `.app-dark` class is on <html>. */
  readonly dark: boolean;
  /** The user's chosen accent, resolved to a concrete rgb() string. */
  readonly primary: string;
  readonly text: string;
  readonly muted: string;
  /** Hairline gridlines and axis rules. */
  readonly grid: string;
  /** The card surface a chart is painted on — also the colour of the gaps between marks. */
  readonly surface: string;
  readonly categorical: readonly string[];
  readonly status: ChartStatusColors;
}

/**
 * Series colours for multi-series charts. Deliberately NOT derived from the
 * themeable accent: a reader learns "collected is blue", and that must survive
 * the user switching the app to amber. Each set is stepped for its own surface
 * (dark is re-stepped, never a flipped light palette) and both clear the
 * colour-vision gates for adjacent pairs.
 */
const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const;
const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500'] as const;

/** Reserved for state (good / warning / serious / critical) — never used as a series colour. */
const STATUS: ChartStatusColors = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

/**
 * Chart.js paints to a canvas, so it cannot read CSS variables the way the rest of
 * the UI does — the token values have to be resolved to literal colours and handed
 * over, then handed over again whenever the theme changes.
 */
@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly themeService = inject(ThemeService);

  private readonly _theme = signal<ChartTheme>(readChartTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      this.themeService.revision();
      // The palette swap rewrites PrimeNG's <style> element in this same task, so
      // wait a frame — read any sooner and getComputedStyle still reports the
      // outgoing colours.
      requestAnimationFrame(() => this._theme.set(readChartTheme()));
    });
  }
}

/**
 * Re-expresses a colour at the given opacity. Chart.js needs a literal for the
 * area washes, and the token values arrive as `rgb(r, g, b)`.
 */
export function withAlpha(color: string, alpha: number): string {
  const rgb = color.match(/-?\d+(\.\d+)?/g);
  if (color.startsWith('rgb') && rgb && rgb.length >= 3) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  const hex = color.trim().replace('#', '');
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  if (/^[0-9a-f]{6}$/i.test(expanded)) {
    const value = parseInt(expanded, 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }

  return color;
}

function readChartTheme(): ChartTheme {
  const dark = document.documentElement.classList.contains('app-dark');
  const read = withProbe();

  return {
    dark,
    // Semantic tokens point at other tokens (`--p-primary-color` is really
    // `var(--p-primary-500)`), so they are resolved through a probe element
    // rather than read off the custom property, which would hand back the
    // unresolved `var(...)` text.
    primary: read('--p-primary-color', dark ? '#34d399' : '#10b981'),
    text: read('--p-text-color', dark ? '#ffffff' : '#0b0b0b'),
    muted: read('--p-text-muted-color', '#898781'),
    grid: read('--p-content-border-color', dark ? '#2c2c2a' : '#e1e0d9'),
    surface: read('--p-card-background', dark ? '#18181b' : '#ffffff'),
    categorical: dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT,
    status: STATUS,
  };
}

/** Resolves CSS custom properties — including chains of them — to literal colours. */
function withProbe(): (token: string, fallback: string) => string {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
  document.body.appendChild(probe);

  const read = (token: string, fallback: string): string => {
    probe.style.color = `var(${token}, ${fallback})`;
    return getComputedStyle(probe).color || fallback;
  };

  // Hand back a reader that tidies up once the caller stops needing it. Reading is
  // synchronous and happens in one pass, so the probe is removed on a microtask.
  queueMicrotask(() => probe.remove());
  return read;
}
