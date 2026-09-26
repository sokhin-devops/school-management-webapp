import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';

/** com.school_management_webapi.dto.response.SettingsResponse.Security */
export interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordExpiryDays: number;
  signOutOnPasswordChange: boolean;
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
  /** False until two-factor sign-in exists; the switch is not offered before then. */
  twoFactorAvailable: boolean;
}

/** One sign-in of the current user. */
export interface SignInSession {
  id: string;
  device: string;
  ipAddress: string | null;
  startedAt: string;
  lastSeenAt: string;
  current: boolean;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  ipAddress: string | null;
  occurredAt: string;
}

/** 67-security.md: the school's rules, your own sessions, and the school's audit trail. */
@Injectable({ providedIn: 'root' })
export class SecuritySettingsService {
  private readonly api = inject(ApiClientService);

  policy(): Observable<SecurityPolicy> {
    return this.api.get<SecurityPolicy>('api/v1/settings/security');
  }

  savePolicy(policy: SecurityPolicy): Observable<SecurityPolicy> {
    const { twoFactorAvailable: _available, ...body } = policy;
    return this.api.put<SecurityPolicy>('api/v1/settings/security', body);
  }

  sessions(): Observable<SignInSession[]> {
    return this.api.get<SignInSession[]>('api/v1/auth/sessions');
  }

  revoke(sessionId: string): Observable<void> {
    return this.api.delete<void>(`api/v1/auth/sessions/${sessionId}`);
  }

  audit(size = 50): Observable<AuditEntry[]> {
    return this.api.get<AuditEntry[]>('api/v1/settings/security/audit', { size });
  }
}
