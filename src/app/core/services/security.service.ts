import { Injectable, signal } from '@angular/core';

/** A signed-in device shown in Settings > Security > Active sessions (67-security.md). */
export interface SecuritySession {
  id: string;
  user: string;
  role: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActiveAt: Date;
  /** The session doing the reading — it is never offered a Revoke button. */
  current: boolean;
}

/** One entry of the security audit trail (67-security.md). */
export interface SecurityAuditEvent {
  id: string;
  actor: string;
  action: string;
  occurredAt: Date;
  ipAddress: string;
}

/**
 * Timestamps are relative to load rather than fixed dates, so "Last active"
 * stays plausible however long the mock data sits here.
 */
const NOW = Date.now();

function minutesAgo(minutes: number): Date {
  return new Date(NOW - minutes * 60_000);
}

function hoursAgo(hours: number): Date {
  return minutesAgo(hours * 60);
}

function daysAgo(days: number): Date {
  return hoursAgo(days * 24);
}

function session(
  id: string,
  user: string,
  role: string,
  device: string,
  location: string,
  ipAddress: string,
  lastActiveAt: Date,
  current = false,
): SecuritySession {
  return { id, user, role, device, location, ipAddress, lastActiveAt, current };
}

function seedSessions(): SecuritySession[] {
  return [
    session('ses-01', 'Sopheak Chan', 'Owner', 'Chrome on Windows', 'Phnom Penh, Cambodia', '203.0.113.14', minutesAgo(2), true),
    session('ses-02', 'Sopheak Chan', 'Owner', 'Safari on iPhone', 'Phnom Penh, Cambodia', '203.0.113.52', minutesAgo(48)),
    session('ses-03', 'Rachel Owusu', 'Teacher', 'Chrome on macOS', 'Phnom Penh, Cambodia', '203.0.113.87', minutesAgo(11)),
    session('ses-04', 'Daniel Ferreira', 'Teacher', 'Edge on Windows', 'Siem Reap, Cambodia', '198.51.100.23', hoursAgo(3)),
    session('ses-05', 'Priya Raman', 'Teacher', 'Chrome on Android', 'Phnom Penh, Cambodia', '198.51.100.61', hoursAgo(6)),
    session('ses-06', 'Marcus Bennett', 'Accounting', 'Firefox on Windows', 'Bangkok, Thailand', '203.0.113.120', hoursAgo(9)),
    session('ses-07', 'Chen Wei', 'Teacher', 'Safari on iPad', 'Phnom Penh, Cambodia', '198.51.100.9', hoursAgo(20)),
    session('ses-08', 'Amara Diallo', 'Teacher', 'Chrome on Windows', 'Phnom Penh, Cambodia', '203.0.113.201', daysAgo(2)),
    session('ses-09', 'Tomas Novak', 'Teacher', 'Chrome on Linux', 'Singapore', '198.51.100.145', daysAgo(3)),
    session('ses-10', 'Nadia Haddad', 'Teacher', 'Safari on macOS', 'Phnom Penh, Cambodia', '203.0.113.33', daysAgo(5)),
  ];
}

function auditEvent(id: string, actor: string, action: string, occurredAt: Date, ipAddress: string): SecurityAuditEvent {
  return { id, actor, action, occurredAt, ipAddress };
}

function seedAuditEvents(): SecurityAuditEvent[] {
  return [
    auditEvent('aud-01', 'Sopheak Chan', 'Signed in', minutesAgo(4), '203.0.113.14'),
    auditEvent('aud-02', 'Rachel Owusu', 'Signed in', minutesAgo(14), '203.0.113.87'),
    auditEvent('aud-03', 'Sopheak Chan', 'Updated the password policy', minutesAgo(35), '203.0.113.14'),
    auditEvent('aud-04', 'Daniel Ferreira', 'Failed sign-in attempt', hoursAgo(2), '198.51.100.23'),
    auditEvent('aud-05', 'Daniel Ferreira', 'Changed own password', hoursAgo(2), '198.51.100.23'),
    auditEvent('aud-06', 'Sopheak Chan', 'Enabled two-factor authentication', hoursAgo(5), '203.0.113.14'),
    auditEvent('aud-07', 'Marcus Bennett', 'Exported the payments report', hoursAgo(8), '203.0.113.120'),
    auditEvent('aud-08', 'Sopheak Chan', 'Invited nadia.haddad@school.edu', hoursAgo(11), '203.0.113.14'),
    auditEvent('aud-09', 'Priya Raman', 'Signed out of all devices', hoursAgo(18), '198.51.100.61'),
    auditEvent('aud-10', 'Sopheak Chan', 'Changed the role of Marcus Bennett to Accounting', daysAgo(1), '203.0.113.52'),
    auditEvent('aud-11', 'Helen Castillo', 'Account locked after 5 failed attempts', daysAgo(2), '198.51.100.77'),
    auditEvent('aud-12', 'Sopheak Chan', 'Revoked a session for Grace Mwangi', daysAgo(3), '203.0.113.14'),
    auditEvent('aud-13', 'Sopheak Chan', 'Deactivated the account of Grace Mwangi', daysAgo(4), '203.0.113.14'),
    auditEvent('aud-14', 'Chen Wei', 'Signed in from a new device', daysAgo(6), '198.51.100.9'),
  ];
}

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly _sessions = signal<SecuritySession[]>(seedSessions());
  private readonly _auditEvents = signal<SecurityAuditEvent[]>(seedAuditEvents());

  readonly sessions = this._sessions.asReadonly();
  readonly auditEvents = this._auditEvents.asReadonly();
}
