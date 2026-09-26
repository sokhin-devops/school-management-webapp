import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import {
  NotificationPreference,
  NotificationPreferenceGroup,
  NotificationService,
} from '../../../core/services/notification.service';
import { describeFailure } from '../../../core/api/api-failure';

/**
 * 65-notifications.md — what each person is told about, and where it reaches
 * them. The events come from the server, so every switch on this page is for
 * something the system actually raises.
 *
 * These are the signed-in person's own choices; nobody sets them for anyone
 * else, so there is no permission to check beyond being signed in.
 */
@Component({
  selector: 'app-notification-settings',
  imports: [FormsModule, ButtonModule, CheckboxModule, SkeletonModule, TagModule, SettingsSectionComponent],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
})
export class NotificationSettingsComponent {
  private readonly notifications = inject(NotificationService);
  private readonly messages = inject(MessageService);

  protected readonly groups = signal<NotificationPreferenceGroup[]>([]);
  protected readonly emailAvailable = signal(false);
  protected readonly loaded = signal(false);
  protected readonly loadError = signal<string | null>(null);
  /** The group whose Save is in flight, so only its button spins. */
  protected readonly savingGroup = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loadError.set(null);
    this.notifications.preferences().subscribe({
      next: (preferences) => this.accept(preferences.groups, preferences.emailAvailable),
      error: (failure: unknown) => this.loadError.set(describeFailure(failure)),
    });
  }

  protected toggle(group: NotificationPreferenceGroup, preference: NotificationPreference, channel: 'inApp' | 'email',
    value: boolean): void {
    this.groups.update((groups) =>
      groups.map((g) =>
        g.key !== group.key
          ? g
          : { ...g, preferences: g.preferences.map((p) => (p.key === preference.key ? { ...p, [channel]: value } : p)) },
      ),
    );
  }

  /**
   * Saves every group, not only the one whose button was pressed: the server
   * takes the whole set, and saving a part would read as undoing the rest.
   */
  protected save(group: NotificationPreferenceGroup): void {
    if (this.savingGroup()) {
      return;
    }
    this.savingGroup.set(group.key);
    const all = this.groups().flatMap((g) => g.preferences);
    this.notifications.savePreferences(all).subscribe({
      next: (saved) => {
        this.accept(saved.groups, saved.emailAvailable);
        this.savingGroup.set(null);
        this.messages.add({ severity: 'success', summary: 'Notification preferences saved', life: 3000 });
      },
      error: (failure: unknown) => {
        this.savingGroup.set(null);
        this.messages.add({ severity: 'error', summary: 'Could not save', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  private accept(groups: NotificationPreferenceGroup[], emailAvailable: boolean): void {
    this.groups.set(groups ?? []);
    this.emailAvailable.set(emailAvailable);
    this.loaded.set(true);
  }
}
