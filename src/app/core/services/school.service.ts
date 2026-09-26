import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { setCurrency } from '../../share/data/format';

/** com.school_management_webapi.dto.response.SchoolResponse */
export interface SchoolProfile {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  shortName: string | null;
  website: string | null;
  currency: string;
}

export type SchoolProfileWrite = Omit<SchoolProfile, 'id'>;

/**
 * The school behind the signed-in tenant - 61-school-settings.md.
 *
 * Loaded by the shell, because its currency is how every amount in the app is
 * shown: finance pages and reports read it through `money()` rather than
 * asking for the school themselves.
 */
@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly api = inject(ApiClientService);

  private readonly _school = signal<SchoolProfile | null>(null);
  private readonly _error = signal<string | null>(null);
  private loading = false;

  readonly school = this._school.asReadonly();
  readonly error = this._error.asReadonly();

  ensureLoaded(): void {
    if (this._school() || this.loading) {
      return;
    }
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this._error.set(null);
    this.api.get<SchoolProfile[]>('api/v1/schools').subscribe({
      next: (schools) => {
        this.loading = false;
        // One school per tenant today; the list shape leaves room for more.
        this.accept((schools ?? [])[0] ?? null);
      },
      error: () => {
        this.loading = false;
        this._error.set('The school profile could not be loaded.');
      },
    });
  }

  save(id: string, school: SchoolProfileWrite): Observable<SchoolProfile> {
    return this.api.put<SchoolProfile>(`api/v1/schools/${id}`, school).pipe(tap((saved) => this.accept(saved)));
  }

  /** Cleared on sign-out, so the next school on this device is shown in its own currency. */
  clear(): void {
    this._school.set(null);
    setCurrency('USD');
  }

  private accept(school: SchoolProfile | null): void {
    this._school.set(school);
    setCurrency(school?.currency);
  }
}
