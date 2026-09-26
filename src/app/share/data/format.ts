/**
 * Shared number formatting, so money looks the same on every finance page and in
 * every report. The formatter is built once per currency rather than per call —
 * `Intl` formatters are expensive to construct and these run per table row.
 */
function currencyFormat(code: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 });
  } catch {
    // An unknown code falls back rather than breaking every amount on screen.
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
}

let CURRENCY = currencyFormat('USD');

/**
 * 61-school-settings.md: amounts are stored as plain numbers and shown in the
 * school's currency. Set once the school is known, and again when it changes.
 */
export function setCurrency(code: string | null | undefined): void {
  CURRENCY = currencyFormat(code || 'USD');
}

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

const READABLE_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * An ISO date (`2026-03-12`) as a reader says it (`12 Mar 2026`).
 *
 * Parsed from its parts rather than handed to `new Date()`, which reads a bare
 * date as UTC midnight and shows the day before anywhere west of Greenwich.
 */
export function readableDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  return READABLE_DATE.format(new Date(year, month - 1, day));
}

/** The badge an Active / Inactive record wears, matching k-status-tag. */
export function statusBadge(status: string): { label: string; severity: 'success' | 'secondary' } {
  return status === 'active'
    ? { label: 'Active', severity: 'success' }
    : { label: 'Inactive', severity: 'secondary' };
}

/** The four ways 63-academic-settings.md lets a school show results. */
export type ResultScale = 'PERCENTAGE' | 'LETTER' | 'GPA' | 'PASS_FAIL';

/** The usual US bands: 90 and over is an A, under 60 an F. */
const LETTER_BANDS: readonly [number, string, number][] = [
  [90, 'A', 4.0],
  [80, 'B', 3.0],
  [70, 'C', 2.0],
  [60, 'D', 1.0],
  [0, 'F', 0.0],
];

/**
 * A result, given as a share of the marks (0-100), in the school's scale.
 *
 * Marks are always stored as scores out of a maximum; the scale only changes
 * how they read, so switching scales never touches a single mark.
 */
export function formatResult(share: number | null | undefined, scale: ResultScale, passMark: number): string {
  if (share === null || share === undefined || Number.isNaN(share)) {
    return '';
  }
  switch (scale) {
    case 'LETTER':
      return LETTER_BANDS.find(([floor]) => share >= floor)?.[1] ?? 'F';
    case 'GPA':
      return (LETTER_BANDS.find(([floor]) => share >= floor)?.[2] ?? 0).toFixed(1);
    case 'PASS_FAIL':
      return share >= passMark ? 'Pass' : 'Fail';
    default:
      return percent(share, 1);
  }
}

/**
 * An amount in a named currency, whatever the school's own is - for what the
 * platform bills a school, which is priced in the plan's currency.
 */
export function moneyIn(amount: number, currency: string): string {
  return currencyFormat(currency || 'USD').format(amount);
}
