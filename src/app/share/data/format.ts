/**
 * Shared number formatting, so money looks the same on every finance page and in
 * every report. The formatter is built once rather than per call — `Intl`
 * formatters are expensive to construct and these run per table row.
 */
const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function money(amount: number): string {
  return CURRENCY.format(amount);
}

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Turns an enum value such as `partially_paid` into `Partially paid`. */
export function humanize(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The date part of a Date, as the records store it.
 *
 * Built from the local calendar fields rather than toISOString(), which shifts
 * into UTC and can hand back the day before.
 */
export function isoDate(value: Date | null): string {
  if (!value) {
    return '';
  }
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
