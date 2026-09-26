import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClientService } from './api-client.service';

/** com.school_management_webapi.dto.response.NotificationResponse.Item */
export interface AppNotification {
  id: string;
  eventKey: string;
  title: string;
  message: string | null;
  link: string | null;
  createdAt: string;
  read: boolean;
}

interface ApiInbox {
  unread: number;
  items: AppNotification[];
}

export interface NotificationPreference {
  key: string;
  title: string;
  note: string;
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferenceGroup {
  key: string;
  title: string;
  description: string;
  preferences: NotificationPreference[];
}

export interface NotificationPreferences {
  groups: NotificationPreferenceGroup[];
  /** False until something sends mail; the screen keeps that column switched off. */
  emailAvailable: boolean;
}

/** How often the bell asks for anything new while someone is signed in. */
const POLL_EVERY_MS = 60_000;

/**
 * The topbar bell and the preferences behind it - 65-notifications.md.
 *
 * Polled rather than pushed: a minute is soon enough for a school's events,
 * and it needs nothing on the server beyond the list it already serves.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiClientService);

  private readonly _items = signal<AppNotification[]>([]);
  private readonly _unread = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly items = this._items.asReadonly();
  readonly unread = this._unread.asReadonly();
  /** For the badge: "9+" rather than a number too wide for it. */
  readonly badge = computed(() => {
    const count = this._unread();
    return count === 0 ? null : count > 9 ? '9+' : String(count);
  });

  /** Starts polling for the life of the caller - the authenticated shell. */
  start(destroyRef: DestroyRef): void {
    this.refresh();
    if (this.timer === null) {
      this.timer = setInterval(() => this.refresh(), POLL_EVERY_MS);
    }
    destroyRef.onDestroy(() => this.stop());
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this._items.set([]);
    this._unread.set(0);
  }

  refresh(): void {
    this.api.get<ApiInbox>('api/v1/notifications').subscribe({
      next: (inbox) => {
        this._items.set(inbox?.items ?? []);
        this._unread.set(inbox?.unread ?? 0);
      },
      // A missed poll is caught by the next one; the bell keeps what it had.
      error: () => undefined,
    });
  }

  markRead(notification: AppNotification): void {
    if (notification.read) {
      return;
    }
    // Shown as read at once; the server call is the record, not the feedback.
    this._items.update((items) => items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    this._unread.update((count) => Math.max(0, count - 1));
    this.api.post<void>(`api/v1/notifications/${notification.id}/read`, {}).subscribe({ error: () => this.refresh() });
  }

  markAllRead(): void {
    this._items.update((items) => items.map((item) => ({ ...item, read: true })));
    this._unread.set(0);
    this.api.post<void>('api/v1/notifications/read-all', {}).subscribe({ error: () => this.refresh() });
  }

  preferences(): Observable<NotificationPreferences> {
    return this.api.get<NotificationPreferences>('api/v1/notifications/preferences');
  }

  savePreferences(preferences: NotificationPreference[]): Observable<NotificationPreferences> {
    return this.api
      .put<NotificationPreferences>('api/v1/notifications/preferences', {
        preferences: preferences.map(({ key, inApp, email }) => ({ key, inApp, email })),
      })
      .pipe(tap(() => this.refresh()));
  }
}
