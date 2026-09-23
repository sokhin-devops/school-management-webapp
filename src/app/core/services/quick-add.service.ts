import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

/** One entry in the Quick Add menu. */
export interface QuickAddAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  /** The single letter that fires it while the menu is open. Unique app-wide. */
  readonly key: string;
}

export interface QuickAddGroup {
  readonly section: string;
  readonly actions: readonly QuickAddAction[];
}

const GROUPS: readonly QuickAddGroup[] = [
  {
    section: 'People',
    actions: [
      { id: 'student', label: 'Student', icon: 'pi-user', route: '/people/students', key: 'S' },
      { id: 'teacher', label: 'Teacher', icon: 'pi-id-card', route: '/people/teachers', key: 'T' },
      { id: 'parent', label: 'Parent', icon: 'pi-users', route: '/people/parents', key: 'P' },
    ],
  },
  {
    section: 'Academic',
    actions: [
      { id: 'class-group', label: 'Class', icon: 'pi-sitemap', route: '/academic/classes', key: 'C' },
      { id: 'subject', label: 'Subject', icon: 'pi-book', route: '/academic/subjects', key: 'U' },
      { id: 'program', label: 'Programme', icon: 'pi-graduation-cap', route: '/academic/programs', key: 'G' },
      { id: 'level', label: 'Level', icon: 'pi-list', route: '/academic/levels', key: 'L' },
      { id: 'room', label: 'Room', icon: 'pi-home', route: '/academic/rooms', key: 'R' },
      { id: 'academic-year', label: 'Academic year', icon: 'pi-calendar', route: '/academic/academic-years', key: 'Y' },
    ],
  },
  {
    section: 'Finance',
    actions: [
      { id: 'payment', label: 'Payment', icon: 'pi-wallet', route: '/finance/payments', key: 'M' },
      { id: 'fee', label: 'Fee', icon: 'pi-tag', route: '/finance/fees', key: 'F' },
      { id: 'expense', label: 'Expense', icon: 'pi-receipt', route: '/finance/expenses', key: 'E' },
    ],
  },
  {
    section: 'Exams',
    actions: [{ id: 'assessment', label: 'Assessment', icon: 'pi-file-edit', route: '/exams', key: 'A' }],
  },
  {
    section: 'Settings',
    actions: [
      { id: 'branch', label: 'Branch', icon: 'pi-building', route: '/settings/branches', key: 'B' },
      { id: 'user', label: 'User', icon: 'pi-user-plus', route: '/settings/users-roles', key: 'N' },
      { id: 'role', label: 'Role', icon: 'pi-lock', route: '/settings/users-roles', key: 'O' },
    ],
  },
];

/**
 * Quick Add: start a new record of any kind from anywhere in the app.
 *
 * A form belongs to its page — that is where the options it needs come from —
 * so this does not own any dialog. It routes to the page and leaves a request
 * behind; the page picks it up and opens its own form. Being already on the
 * page is the same path, because it is the request that opens the form, not the
 * navigation.
 */
@Injectable({ providedIn: 'root' })
export class QuickAddService {
  private readonly router = inject(Router);

  private readonly _pending = signal<string | null>(null);
  readonly pending = this._pending.asReadonly();

  readonly groups = GROUPS;

  request(action: QuickAddAction): void {
    this._pending.set(action.id);
    void this.router.navigateByUrl(action.route);
  }

  /** The action a typed letter stands for, or undefined if it stands for none. */
  byKey(key: string): QuickAddAction | undefined {
    const wanted = key.toUpperCase();
    return GROUPS.flatMap((group) => group.actions).find((action) => action.key === wanted);
  }

  clear(): void {
    this._pending.set(null);
  }
}

/**
 * Opens a page's create form when Quick Add asked for this kind of record.
 *
 * Call from a page constructor. The request is cleared as it is taken, so
 * returning to the page later does not reopen the form.
 */
export function openOnQuickAdd(id: string, open: () => void): void {
  const quickAdd = inject(QuickAddService);

  effect(() => {
    if (quickAdd.pending() !== id) {
      return;
    }
    untracked(() => {
      quickAdd.clear();
      open();
    });
  });
}
