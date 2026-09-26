import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { ApiClientService } from './api-client.service';

/** com.school_management_webapi.dto.response.TwoFactorResponse.Status */
export interface TwoFactorStatus {
  enabled: boolean;
  /** The school's Security settings insist on it. */
  required: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
}

/** What the authenticator app is given: the QR code's contents, and the key to type by hand. */
export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
}

/**
 * 67-security.md: the signed-in person's own two-factor sign-in. Everything
 * here lives under /auth on the API, so it stays reachable while a school
 * requires two-factor and this person has not set it up yet.
 */
@Injectable({ providedIn: 'root' })
export class TwoFactorService {
  private readonly api = inject(ApiClientService);

  private readonly _status = signal<TwoFactorStatus | null>(null);
  readonly status = this._status.asReadonly();
  private pending$: Observable<TwoFactorStatus | null> | null = null;

  /** Once per session; the guard and the dialog share the answer. */
  ensureLoaded(): Observable<TwoFactorStatus | null> {
    if (this._status()) {
      return of(this._status());
    }
    this.pending$ ??= this.api.get<TwoFactorStatus>('api/v1/auth/two-factor').pipe(
      tap((status) => this._status.set(status)),
      // An API that cannot answer is not a reason to keep anyone out.
      catchError(() => of(null)),
      tap(() => (this.pending$ = null)),
      shareReplay(1),
    );
    return this.pending$;
  }

  reload(): Observable<TwoFactorStatus> {
    return this.api.get<TwoFactorStatus>('api/v1/auth/two-factor').pipe(tap((status) => this._status.set(status)));
  }

  /** Setup is required, and not yet done: every page but the setup page is closed. */
  setupRequired(): boolean {
    const status = this._status();
    return !!status && status.required && !status.enabled;
  }

  beginSetup(): Observable<TwoFactorSetup> {
    return this.api.post<TwoFactorSetup>('api/v1/auth/two-factor/setup');
  }

  /** Answers the recovery codes - shown once, never again. */
  enable(code: string): Observable<{ codes: string[] }> {
    return this.api
      .post<{ codes: string[] }>('api/v1/auth/two-factor/enable', { code })
      .pipe(tap(() => this.refresh()));
  }

  regenerateRecoveryCodes(code: string): Observable<{ codes: string[] }> {
    return this.api
      .post<{ codes: string[] }>('api/v1/auth/two-factor/recovery-codes', { code })
      .pipe(tap(() => this.refresh()));
  }

  disable(password: string, code: string): Observable<void> {
    return this.api.post<void>('api/v1/auth/two-factor/disable', { password, code }).pipe(tap(() => this.refresh()));
  }

  /** An admin's reset, for someone who lost their phone and their recovery codes. */
  resetFor(userId: string): Observable<void> {
    return this.api.delete<void>(`api/v1/users/${userId}/two-factor`);
  }

  clear(): void {
    this._status.set(null);
    this.pending$ = null;
  }

  private refresh(): void {
    this.reload().subscribe({ error: () => undefined });
  }
}
