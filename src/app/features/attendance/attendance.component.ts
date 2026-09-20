import { Component, computed, inject, signal } from '@angular/core';
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

  protected readonly date = signal<Date>(new Date());
  protected readonly session = signal('morning');
  protected readonly className = signal<string | null>('Grade 1 - A');

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
    Array.from(new Set(this.studentService.students().map((student) => student.className)))
      .sort((a, b) => a.localeCompare(b))
      .map((className) => ({ label: className, value: className })),
  );

  protected readonly roster = computed<RosterRow[]>(() => {
    const selected = this.className();
    const marks = this.marks();
    const notes = this.notes();

    return this.studentService
      .students()
      .filter((student) => !selected || student.className === selected)
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
