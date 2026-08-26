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
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthenticatedUser | null>(this.tokenStorage.getUser());
  readonly currentUser = this._currentUser.asReadonly();

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.apiClient
      .post<AuthResponse>('api/v1/auth/register', payload)
      .pipe(tap((auth) => this.storeSession(auth)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.apiClient
      .post<AuthResponse>('api/v1/auth/login', payload)
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
    this._currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  private storeSession(auth: AuthResponse): void {
    this.tokenStorage.setSession(auth);
    this._currentUser.set(auth.user);
  }
}
