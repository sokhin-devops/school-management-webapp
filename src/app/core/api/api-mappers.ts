import { Status } from '../models';
import { ApiStatus } from './api.models';

/**
 * The API spells its enums in SCREAMING_CASE and the screens in lower case.
 *
 * Converted at this one boundary rather than by changing either side: the API
 * follows Java convention and the UI follows its own, and both are right within
 * their own half.
 */
export function toStatus(value: ApiStatus | null | undefined): Status {
  return value === 'INACTIVE' ? Status.Inactive : Status.Active;
}

export function fromStatus(value: Status | null | undefined): ApiStatus {
  return value === Status.Inactive ? 'INACTIVE' : 'ACTIVE';
}

/** An enum the API sends as SCREAMING_SNAKE, shown as "Screaming snake". */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const spaced = value.toLowerCase().replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** A `LocalDate` string from the API as a Date, for the date pickers. */
export function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

/** A Date as the `LocalDate` the API expects, built from local calendar fields. */
export function fromDate(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
