import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';

interface SessionRow {
  readonly device: string;
  readonly location: string;
  readonly lastActive: string;
  readonly current: boolean;
}

interface AuditRow {
  readonly actor: string;
  readonly action: string;
  readonly time: string;
  readonly ip: string;
}

/** 67-security.md — account/session security, password policy, authentication. */
@Component({
  selector: 'app-security-settings',
  imports: [
    FormsModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    MessageModule,
    ToggleSwitchModule,
    TableModule,
    SharedModule,
    SettingsSectionComponent,
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
})
export class SecuritySettingsComponent {
  protected readonly minimumLength = signal(10);
  protected readonly requireUppercase = signal(true);
  protected readonly requireNumber = signal(true);
  protected readonly requireSymbol = signal(false);
  protected readonly expiry = signal(180);

  protected readonly twoFactor = signal(true);
  protected readonly sessionTimeout = signal(60);
  protected readonly signOutOnPasswordChange = signal(true);

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
  ];

  protected readonly sessions: SessionRow[] = [
    { device: 'Chrome on Windows', location: 'Phnom Penh, KH', lastActive: 'Active now', current: true },
    { device: 'Safari on iPhone', location: 'Phnom Penh, KH', lastActive: '2 hours ago', current: false },
    { device: 'Firefox on macOS', location: 'Siem Reap, KH', lastActive: 'Yesterday', current: false },
    { device: 'Chrome on Android', location: 'Bangkok, TH', lastActive: '4 days ago', current: false },
  ];

  protected readonly audit: AuditRow[] = [
    { actor: 'Sophea Chan', action: 'Signed in', time: 'Today, 08:12', ip: '203.0.113.24' },
    { actor: 'Dara Kim', action: 'Changed password', time: 'Today, 07:45', ip: '203.0.113.51' },
    { actor: 'Sophea Chan', action: 'Invited a user', time: 'Yesterday, 16:30', ip: '203.0.113.24' },
    { actor: 'Unknown', action: 'Failed sign-in attempt', time: 'Yesterday, 02:11', ip: '198.51.100.7' },
    { actor: 'Mealea Sok', action: 'Enabled two-factor authentication', time: '2 days ago', ip: '203.0.113.88' },
  ];
}
