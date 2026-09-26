import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { MessageService, SharedModule } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import { CanDirective } from '../../../share/directives/can.directive';
import {
  AuditEntry,
  SecurityPolicy,
  SecuritySettingsService,
  SignInSession,
} from '../../../core/services/security-settings.service';
import { describeFailure } from '../../../core/api/api-failure';

/** What each audit action reads as in the log. */
const ACTION_LABELS: Readonly<Record<string, string>> = {
  SIGNED_IN: 'Signed in',
  SIGN_IN_FAILED: 'Failed sign-in attempt',
  SIGNED_OUT: 'Signed out',
  PASSWORD_RESET: 'Reset their password',
  SESSION_REVOKED: 'Signed out a session',
  USER_INVITED: 'Invited a user',
  USER_UPDATED: "Changed a user's access",
  USER_REMOVED: 'Removed a user',
  ROLE_CREATED: 'Created a role',
  ROLE_UPDATED: 'Changed a role',
  ROLE_DELETED: 'Deleted a role',
  SECURITY_SETTINGS_CHANGED: 'Changed security settings',
  ACADEMIC_SETTINGS_CHANGED: 'Changed academic settings',
  SYSTEM_SETTINGS_CHANGED: 'Changed system settings',
  MAINTENANCE_MODE_CHANGED: 'Changed maintenance mode',
  DATA_EXPORTED: 'Exported all data',
  DATA_DELETED: 'Deleted all school data',
  PLAN_CHANGED: 'Changed the plan',
  PLAN_CANCELED: 'Cancelled the plan',
  TWO_FACTOR_ENABLED: 'Turned on two-factor sign-in',
  TWO_FACTOR_DISABLED: 'Turned off two-factor sign-in',
  TWO_FACTOR_RESET: 'Reset two-factor sign-in for',
  RECOVERY_CODES_REGENERATED: 'Issued new recovery codes',
};

/** 67-security.md — account/session security, password policy, authentication, audit. */
@Component({
  selector: 'app-security-settings',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    MessageModule,
    SkeletonModule,
    TagModule,
    ToggleSwitchModule,
    TableModule,
    SharedModule,
    SettingsSectionComponent,
    CanDirective,
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
})
export class SecuritySettingsComponent {
  private readonly security = inject(SecuritySettingsService);
  private readonly messages = inject(MessageService);

  protected readonly policy = signal<SecurityPolicy | null>(null);
  protected readonly policyError = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly sessions = signal<SignInSession[] | null>(null);
  protected readonly revoking = signal<string | null>(null);

  protected readonly audit = signal<AuditEntry[] | null>(null);
  protected readonly auditError = signal<string | null>(null);

  protected readonly expiryOptions = [
    { label: 'Never', value: 0 },
    { label: 'Every 90 days', value: 90 },
    { label: 'Every 180 days', value: 180 },
    { label: 'Every 365 days', value: 365 },
  ];

  protected readonly timeoutOptions = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: '8 hours', value: 480 },
    { label: '1 day', value: 1440 },
    { label: '7 days', value: 10080 },
  ];

  constructor() {
    this.loadPolicy();
    this.loadSessions();
    this.loadAudit();
  }

  protected loadPolicy(): void {
    this.policyError.set(null);
    this.security.policy().subscribe({
      next: (policy) => this.policy.set(policy),
      error: (failure: unknown) => this.policyError.set(describeFailure(failure)),
    });
  }

  protected loadSessions(): void {
    this.security.sessions().subscribe({
      next: (sessions) => this.sessions.set(sessions ?? []),
      error: () => this.sessions.set([]),
    });
  }

  protected loadAudit(): void {
    this.auditError.set(null);
    this.security.audit().subscribe({
      next: (entries) => this.audit.set(entries ?? []),
      error: (failure: unknown) => this.auditError.set(describeFailure(failure)),
    });
  }

  /** One field of the draft policy, so the template can bind each control. */
  protected set<K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]): void {
    this.policy.update((policy) => (policy ? { ...policy, [key]: value } : policy));
  }

  protected save(): void {
    const policy = this.policy();
    if (!policy || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.security.savePolicy(policy).subscribe({
      next: (saved) => {
        this.policy.set(saved);
        this.saving.set(false);
        this.messages.add({ severity: 'success', summary: 'Security settings saved', life: 3000 });
        this.loadAudit();
      },
      error: (failure: unknown) => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not save', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  protected revoke(session: SignInSession): void {
    this.revoking.set(session.id);
    this.security.revoke(session.id).subscribe({
      next: () => {
        this.revoking.set(null);
        this.sessions.update((sessions) => (sessions ?? []).filter((s) => s.id !== session.id));
        this.messages.add({ severity: 'success', summary: 'Session signed out', detail: session.device, life: 3000 });
      },
      error: (failure: unknown) => {
        this.revoking.set(null);
        this.messages.add({ severity: 'error', summary: 'Could not sign it out', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  protected actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }
}
