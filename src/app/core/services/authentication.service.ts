import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthenticatedUser,
  AuthResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '../models';
import { ApiClientService } from './api-client.service';
import { PermissionService } from './permission.service';
import { AcademicSettingsService } from './academic-settings.service';
import { SchoolService } from './school.service';
import { TokenStorageService } from './token-storage.service';
import { TwoFactorService } from './two-factor.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly academicSettings = inject(AcademicSettingsService);
  private readonly school = inject(SchoolService);
  private readonly twoFactor = inject(TwoFactorService);

  private readonly _currentUser = signal<AuthenticatedUser | null>(this.tokenStorage.getUser());
  readonly currentUser = this._currentUser.asReadonly();

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.apiClient
      .post<AuthResponse>('api/v1/auth/register', payload)
      .pipe(tap((auth) => this.storeSession(auth)));
  }

  /**
   * The password step. With two-factor on, the answer carries only a
   * twoFactorToken, and nothing is stored until completeTwoFactor succeeds.
   */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.apiClient.post<AuthResponse>('api/v1/auth/login', payload).pipe(
      tap((auth) => {
        if (!auth.twoFactorToken) {
          this.storeSession(auth);
        }
      }),
    );
  }

  /** The second step: the code from the authenticator app, or a recovery code. */
  completeTwoFactor(twoFactorToken: string, code: string): Observable<AuthResponse> {
    return this.apiClient
      .post<AuthResponse>('api/v1/auth/login/two-factor', { twoFactorToken, code })
      .pipe(tap((auth) => this.storeSession(auth)));
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResponse> {
    return this.apiClient.post<ForgotPasswordResponse>('api/v1/auth/forgot-password', payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<void> {
    return this.apiClient.post<void>('api/v1/auth/reset-password', payload);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    return this.apiClient
      .post<AuthResponse>('api/v1/auth/refresh-token', { refreshToken })
      .pipe(tap((auth) => this.storeSession(auth)));
  }

  getCurrentUser(): Observable<AuthenticatedUser> {
    return this.apiClient.get<AuthenticatedUser>('api/v1/auth/me');
  }

  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.apiClient.post<void>('api/v1/auth/logout', { refreshToken }).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getAccessToken();
  }

  /** Clears local session state and redirects to Login without calling the API (e.g. when a token refresh fails). */
  clearSession(): void {
    this.tokenStorage.clear();
    // Otherwise the next person to sign in on this device inherits whatever the
    // last one was allowed to see, until their own grid arrives.
    this.permissions.clear();
    this.academicSettings.clear();
    this.school.clear();
    this.twoFactor.clear();
    this._currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  private storeSession(auth: AuthResponse): void {
    this.tokenStorage.setSession(auth);
    this._currentUser.set(auth.user);
  }
}
