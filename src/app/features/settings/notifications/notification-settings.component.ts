import { Component, signal, type WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { SettingsSectionComponent } from '../../../share/components';

/** One event a user can subscribe to, with a switch per delivery channel. */
export interface NotificationPreference {
  key: string;
  title: string;
  note: string;
  inApp: WritableSignal<boolean>;
  email: WritableSignal<boolean>;
  push: WritableSignal<boolean>;
}

export interface NotificationGroup {
  key: string;
  title: string;
  description: string;
  preferences: NotificationPreference[];
}

function preference(key: string, title: string, note: string, inApp: boolean, email: boolean): NotificationPreference {
  return { key, title, note, inApp: signal(inApp), email: signal(email), push: signal(false) };
}

/** 65-notifications.md — what each person is told about, and where it reaches them. */
@Component({
  selector: 'app-notification-settings',
  imports: [FormsModule, ButtonModule, CheckboxModule, TagModule, SettingsSectionComponent],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
})
export class NotificationSettingsComponent {
  protected readonly groups: NotificationGroup[] = [
    {
      key: 'academic',
      title: 'Academic',
      description: 'Classes, attendance and results.',
      preferences: [
        preference('timetable', 'Timetable changed', 'A class is moved, cancelled or given a different room.', true, true),
        preference('attendance', 'Attendance submitted', 'A register is completed for a class you follow.', true, false),
        preference('grades', 'Grades published', 'Results are released for an assessment or a reporting period.', true, true),
        preference('rollover', 'Academic year rolled over', 'The active year changes and classes carry forward.', true, true),
      ],
    },
    {
      key: 'finance',
      title: 'Finance',
      description: 'Invoices, payments and spending.',
      preferences: [
        preference('invoice', 'Invoice issued', 'A fee invoice is raised for a student.', true, true),
        preference('payment', 'Payment received', 'A payment is recorded against an invoice.', true, false),
        preference('overdue', 'Payment overdue', 'An invoice passes its due date unpaid.', true, true),
        preference('expense', 'Expense awaiting approval', 'Someone submits an expense that needs a decision.', true, true),
      ],
    },
    {
      key: 'people',
      title: 'People',
      description: 'Students, staff and families.',
      preferences: [
        preference('enrolment', 'Student enrolled', 'A student record is created and placed in a class.', true, false),
        preference('staff', 'Staff record changed', 'A teacher joins, leaves or moves department.', true, false),
        preference('portal', 'Message from a parent', 'A parent replies through the portal.', true, true),
      ],
    },
    {
      key: 'system',
      title: 'System',
      description: 'Accounts, access and service notices.',
      preferences: [
        preference('invite', 'User invited', 'Someone is invited to the workspace, or accepts an invitation.', true, false),
        preference('permissions', 'Role or permissions changed', 'A role is edited, or a user is moved between roles.', true, true),
        preference('signin', 'Sign-in from a new device', 'An account is used from a device it has not been seen on.', true, true),
        preference('maintenance', 'Scheduled maintenance', 'Planned downtime is announced in advance.', true, true),
      ],
    },
  ];
}
