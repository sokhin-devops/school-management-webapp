import { Injectable } from '@angular/core';
import { AuthenticatedUser, AuthResponse } from '../models';

const ACCESS_TOKEN_KEY = 'sm_access_token';
const REFRESH_TOKEN_KEY = 'sm_refresh_token';
const USER_KEY = 'sm_user';

/**
 * Single source of truth for where auth tokens/user live (localStorage).
 *
 * Everything read back is treated as untrusted: storage outlives releases, can
 * be edited by hand, and can hold a half-written session. A value that does not
 * parse reads as signed out rather than throwing — this is read while the app
 * is still starting, where an exception takes every page down with it.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return readToken(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return readToken(REFRESH_TOKEN_KEY);
  }

  getUser(): AuthenticatedUser | null {
    const raw = read(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const user = JSON.parse(raw) as AuthenticatedUser | null;
      return user && typeof user === 'object' ? user : null;
    } catch {
      // A session whose user cannot be read is not a session. Clearing it sends
      // the next guarded navigation to Login instead of into a broken shell.
      this.clear();
      return null;
    }
  }

  setSession(auth: AuthResponse): void {
    write(ACCESS_TOKEN_KEY, auth.accessToken);
    write(REFRESH_TOKEN_KEY, auth.refreshToken);
    write(USER_KEY, JSON.stringify(auth.user));
  }

  clear(): void {
    for (const key of [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage that cannot be written to holds nothing to clear.
      }
    }
  }
}

/** Storage throws in a private window rather than returning null. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** "undefined" and "null" are what a failed sign-in writes when it stores a missing field. */
function readToken(key: string): string | null {
  const value = read(key);
  return value && value !== 'undefined' && value !== 'null' ? value : null;
}

function write(key: string, value: string | undefined): void {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Nowhere to keep the session; the next guarded page asks for a sign-in.
  }
}
