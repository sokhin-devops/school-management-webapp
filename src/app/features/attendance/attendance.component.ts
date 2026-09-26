import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { EmptyStateComponent, ListShellComponent } from '../../share/components';
import { StudentRecord, StudentService } from '../../core/services/student.service';
import { isoDate } from '../../share/data/format';
import { AttendanceService } from '../../core/services/attendance.service';
import { ClassGroupService } from '../../core/services/class-group.service';

export type AttendanceMark = 'present' | 'absent' | 'late' | 'excused';

interface RosterRow {
  readonly student: StudentRecord;
  readonly mark: AttendanceMark;
  readonly note: string;
}

/** 30-attendance.md — records, date/session selection, class filtering. */
@Component({
  selector: 'app-attendance',
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    AvatarModule,
    TableModule,
    SharedModule,
    ListShellComponent,
    EmptyStateComponent,
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss',
})
export class AttendanceComponent {
  private readonly studentService = inject(StudentService);
  private readonly classGroupService = inject(ClassGroupService);
  private readonly attendance = inject(AttendanceService);

  protected readonly date = signal<Date>(new Date());
  protected readonly session = signal('morning');
  /** The class being taken, by id: a register is keyed by the class, not its name. */
  protected readonly classGroupId = signal<string | null>(null);

  /** Marks keyed by student id; everyone starts present, which is the common case. */
  private readonly marks = signal<Record<string, AttendanceMark>>({});
  private readonly notes = signal<Record<string, string>>({});

  protected readonly sessionOptions = [
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
  ];

  protected readonly markOptions: { label: string; value: AttendanceMark }[] = [
    { label: 'P', value: 'present' },
    { label: 'A', value: 'absent' },
    { label: 'L', value: 'late' },
    { label: 'E', value: 'excused' },
  ];

  protected readonly classOptions = computed(() =>
    this.classGroupService
      .classes()
      .map((group) => ({ label: group.name, value: group.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly roster = computed<RosterRow[]>(() => {
    const selected = this.classGroupId();
    const marks = this.marks();
    const notes = this.notes();

    return this.studentService
      .students()
      .filter((student) => !selected || student.classGroupId === selected)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      .map((student) => ({
        student,
        mark: marks[student.id] ?? 'present',
        note: notes[student.id] ?? '',
      }));
  });

  protected readonly summary = computed(() => {
    const rows = this.roster();
    const count = (mark: AttendanceMark) => rows.filter((row) => row.mark === mark).length;

    return {
      present: count('present'),
      absent: count('absent'),
      late: count('late'),
      excused: count('excused'),
      total: rows.length,
    };
  });

  protected readonly saving = this.attendance.saving;
  protected readonly loadingRegister = this.attendance.loading;
  protected readonly registerError = this.attendance.error;
  protected readonly savedAt = signal<string | null>(null);

  constructor() {
    // A register already taken is shown as it was left, rather than as a sheet
    // of defaults that would overwrite it on the next save.
    effect(() => {
      const classGroupId = this.classGroupId();
      const date = isoDate(this.date());
      const session = this.session();
      if (!classGroupId || !date) {
        return;
      }

      untracked(() => {
        this.attendance.loadRegister(classGroupId, date, session).subscribe({
          next: (register) => {
            const marks: Record<string, AttendanceMark> = {};
            const notes: Record<string, string> = {};
            for (const entry of register.entries) {
              marks[entry.studentId] = entry.status;
              if (entry.note) {
                notes[entry.studentId] = entry.note;
              }
            }
            this.marks.set(marks);
            this.notes.set(notes);
            this.savedAt.set(register.entries.length ? 'Loaded what was recorded for this sitting' : null);
          },
          error: () => {
            this.marks.set({});
            this.notes.set({});
          },
        });
      });
    });
  }

  /** Saves the whole sitting: a student left out is a student with no mark. */
  protected saveRegister(): void {
    const classGroupId = this.classGroupId();
    if (!classGroupId) {
      return;
    }

    const entries = this.roster().map((row) => ({
      studentId: row.student.id,
      status: row.mark,
      note: row.note,
    }));

    this.attendance
      .saveRegister(classGroupId, isoDate(this.date()), this.session(), entries)
      .subscribe({
        next: (register) => this.savedAt.set(`Saved — ${register.present} present of ${register.entries.length}`),
      });
  }

  protected setMark(studentId: string, mark: AttendanceMark | null): void {
    if (!mark) {
      return;
    }
    this.marks.update((current) => ({ ...current, [studentId]: mark }));
  }

  protected setNote(studentId: string, note: string): void {
    this.notes.update((current) => ({ ...current, [studentId]: note }));
  }

  protected markAllPresent(): void {
    this.marks.set({});
    this.notes.set({});
  }

  protected initials(student: StudentRecord): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  }

  protected fullName(student: StudentRecord): string {
    return `${student.firstName} ${student.lastName}`;
  }
}
