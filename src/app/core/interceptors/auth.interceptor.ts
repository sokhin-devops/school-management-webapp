import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { TokenStorageService } from '../services/token-storage.service';

const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
];

const isPublicAuthRequest = (url: string): boolean => PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

/** Attaches the stored access token to requests and retries once via a refresh token on a 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const isPublic = isPublicAuthRequest(req.url);
  const accessToken = tokenStorage.getAccessToken();

  const authorizedReq = !isPublic && accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      // The school started requiring two-factor while this session was open.
      if (error instanceof HttpErrorResponse && error.status === 403
          && error.error?.errorCode === 'TWO_FACTOR_SETUP_REQUIRED') {
        router.navigateByUrl('/two-factor-setup');
        return throwError(() => error);
      }
      if (isPublic || !(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((auth) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken}` } })),
        ),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
