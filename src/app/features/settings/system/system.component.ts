import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SettingsSectionComponent } from '../../../share/components';

/**
 * 69-system-settings.md — platform-level configuration, kept out of School and
 * Academic settings, and deliberately small for the first release.
 */
@Component({
  selector: 'app-system-settings',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    MessageModule,
    ToggleSwitchModule,
    SettingsSectionComponent,
  ],
  templateUrl: './system.component.html',
  styleUrl: './system.component.scss',
})
export class SystemSettingsComponent {
  protected readonly maintenanceMode = signal(false);
  protected readonly retention = signal(365);

  protected readonly environment = [
    { label: 'Version', value: '1.4.2' },
    { label: 'Environment', value: 'Production' },
    { label: 'Region', value: 'ap-southeast-1' },
    { label: 'Last deployed', value: '18 September 2026' },
  ];

  protected readonly retentionOptions = [
    { label: '1 year', value: 365 },
    { label: '3 years', value: 1095 },
    { label: '7 years', value: 2555 },
    { label: 'Keep indefinitely', value: 0 },
  ];
}
