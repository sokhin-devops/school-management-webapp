import { Component, computed, effect, inject, input, model, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { SharedModule } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { EmptyStateComponent } from '../../../share/components/empty-state/empty-state.component';
import { FormDialogComponent } from '../../../share/components/form-dialog/form-dialog.component';
import { SaveState } from '../../../share/data/save-state';
import { formatResult } from '../../../share/data/format';
import { describeFailure } from '../../../core/api/api-failure';
import { AcademicSettingsService } from '../../../core/services/academic-settings.service';
import { AssessmentRecord, AssessmentService } from '../../../core/services/assessment.service';
import { StudentRecord, StudentService } from '../../../core/services/student.service';

interface MarkRow {
  readonly student: StudentRecord;
  readonly score: number | null;
  readonly remark: string;
}

/**
 * 31-exams-and-grades.md: the scores behind an assessment, entered a class at
 * a time. The class list is the roster; a student left blank is not marked,
 * which keeps an absence from reading as a zero in the average.
 */
@Component({
  selector: 'app-mark-sheet',
  providers: [SaveState],
  imports: [
    FormsModule,
    InputNumberModule,
    InputTextModule,
    TableModule,
    SharedModule,
    SkeletonModule,
    MessageModule,
    EmptyStateComponent,
    FormDialogComponent,
  ],
  templateUrl: './mark-sheet.component.html',
})
export class MarkSheetComponent {
  private readonly assessments = inject(AssessmentService);
  private readonly studentService = inject(StudentService);
  private readonly academicSettings = inject(AcademicSettingsService);
  private readonly saveState = inject(SaveState);

  readonly visible = model(false);
  readonly assessment = input<AssessmentRecord | null>(null);

  private readonly scores = signal<Record<string, number | null>>({});
  private readonly remarks = signal<Record<string, string>>({});
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly title = computed(() => `Marks · ${this.assessment()?.name ?? ''}`);
  protected readonly subtitle = computed(() => {
    const record = this.assessment();
    return record ? [record.subject, record.className, `out of ${record.maxScore}`].filter(Boolean).join(' · ') : '';
  });

  protected readonly rows = computed<MarkRow[]>(() => {
    const record = this.assessment();
    if (!record) {
      return [];
    }
    const scores = this.scores();
    const remarks = this.remarks();
    return this.studentService
      .students()
      .filter((student) => student.classGroupId === record.classGroupId)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      .map((student) => ({ student, score: scores[student.id] ?? null, remark: remarks[student.id] ?? '' }));
  });

  /** What the class average will be once saved, in the school's grading scale. */
  protected readonly preview = computed(() => {
    const record = this.assessment();
    const marked = this.rows().filter((row) => row.score !== null);
    if (!record || !marked.length) {
      return 'No one marked yet';
    }
    const average = marked.reduce((sum, row) => sum + (row.score ?? 0), 0) / marked.length;
    const settings = this.academicSettings.settings();
    const result = formatResult((average / record.maxScore) * 100, settings.gradingScale, settings.passMark);
    return `${marked.length} of ${this.rows().length} marked · average ${round(average)} / ${record.maxScore} (${result})`;
  });

  constructor() {
    // The sheet on the server is the starting point, so saving never wipes
    // marks somebody else entered.
    effect(() => {
      const record = this.assessment();
      if (!this.visible() || !record) {
        return;
      }
      untracked(() => this.load(record.id));
    });
  }

  protected setScore(studentId: string, score: number | null): void {
    this.scores.update((current) => ({ ...current, [studentId]: score ?? null }));
  }

  protected setRemark(studentId: string, remark: string): void {
    this.remarks.update((current) => ({ ...current, [studentId]: remark }));
  }

  protected save(): void {
    const record = this.assessment();
    if (!record) {
      return;
    }
    const entries = this.rows()
      .filter((row) => row.score !== null || row.remark.trim())
      .map((row) => ({ studentId: row.student.id, score: row.score, remark: row.remark.trim() || null }));

    this.saveState.run(this.assessments.saveMarks(record.id, entries), {
      success: 'Marks saved',
      done: () => this.visible.set(false),
    });
  }

  protected fullName(student: StudentRecord): string {
    return `${student.firstName} ${student.lastName}`;
  }

  private load(assessmentId: string): void {
    this.scores.set({});
    this.remarks.set({});
    this.loadError.set(null);
    this.loading.set(true);
    this.assessments.markSheet(assessmentId).subscribe({
      next: (sheet) => {
        const scores: Record<string, number | null> = {};
        const remarks: Record<string, string> = {};
        for (const entry of sheet.scores) {
          scores[entry.studentId] = entry.score;
          if (entry.remark) {
            remarks[entry.studentId] = entry.remark;
          }
        }
        this.scores.set(scores);
        this.remarks.set(remarks);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.loadError.set(describeFailure(failure));
        this.loading.set(false);
      },
    });
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
