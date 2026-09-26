import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  RecordDrawerComponent,
  type RecordDetail,
} from '../../share/components';
import { RecordFilter, createRecordList } from '../../share/data/record-list';
import { formatResult, humanize, readableDate } from '../../share/data/format';
import { AcademicSettingsService } from '../../core/services/academic-settings.service';
import { AssessmentRecord, AssessmentService, AssessmentType } from '../../core/services/assessment.service';
import { AssessmentFormComponent } from './assessment-form/assessment-form.component';
import { ClassGroupService } from '../../core/services/class-group.service';
import { openOnQuickAdd } from '../../core/services/quick-add.service';
import { SubjectService } from '../../core/services/subject.service';
import { CanDirective } from '../../share/directives/can.directive';
import { SaveState } from '../../share/data/save-state';
import { RecordRemovalService } from '../../share/data/record-removal.service';
import { PermissionService } from '../../core/services/permission.service';
import { PermissionAction } from '../../core/models';
import { TooltipModule } from 'primeng/tooltip';
import { MarkSheetComponent } from './mark-sheet/mark-sheet.component';

/** 31-exams-and-grades.md — assessments, scores and results. */
@Component({
  selector: 'app-exam',
  providers: [SaveState],
  imports: [CanDirective, 
    DatePipe,
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    AssessmentFormComponent,
    RecordDrawerComponent,
    TooltipModule,
    MarkSheetComponent,
  ],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss',
})
export class ExamComponent {
  protected readonly assessmentService = inject(AssessmentService);
  private readonly academicSettings = inject(AcademicSettingsService);
  private readonly subjectService = inject(SubjectService);
  private readonly classGroupService = inject(ClassGroupService);

  protected readonly subjectFilter = new RecordFilter<AssessmentRecord, string>(
    (assessment, value) => assessment.subject === value,
  );

  protected readonly typeFilter = new RecordFilter<AssessmentRecord, AssessmentType>(
    (assessment, value) => assessment.type === value,
  );

  /**
   * The API stores ids; the table shows names. Resolved here rather than by the
   * service, because this is the page that already has both lists.
   */
  private readonly named = computed<AssessmentRecord[]>(() => {
    const subjects = new Map(this.subjectService.subjects().map((subject) => [subject.id, subject.name]));
    const classes = new Map(this.classGroupService.classes().map((group) => [group.id, group.name]));

    return this.assessmentService.assessments().map((assessment) => ({
      ...assessment,
      subject: subjects.get(assessment.subjectId) ?? '',
      className: classes.get(assessment.classGroupId) ?? '',
    }));
  });

  protected readonly records = createRecordList<AssessmentRecord>({
    source: this.named,
    searchKeys: [
      (assessment) => assessment.name,
      (assessment) => assessment.subject,
      (assessment) => assessment.className,
      (assessment) => assessment.type,
    ],
    sortKeys: {
      name: (assessment) => assessment.name,
      subject: (assessment) => assessment.subject,
      date: (assessment) => assessment.date,
      averageScore: (assessment) => assessment.averageScore,
    },
    defaultSortField: 'date',
    filters: [this.subjectFilter, this.typeFilter] as never[],
    noun: { one: 'assessment', many: 'assessments' },
  });

  protected readonly typeOptions: { label: string; value: AssessmentType }[] = [
    { label: 'Quiz', value: 'Quiz' },
    { label: 'Midterm', value: 'Midterm' },
    { label: 'Final', value: 'Final' },
    { label: 'Assignment', value: 'Assignment' },
  ];

  /** Real subjects, keyed by id, because that is what an assessment stores. */
  protected readonly subjectOptions = computed(() =>
    this.subjectService
      .subjects()
      .map((subject) => ({ label: subject.name, value: subject.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );


  constructor() {
    openOnQuickAdd('assessment', () => this.openCreate());
    this.records.sortOrder.set(-1);
  }

  /** 31-exams-and-grades.md: grading scales are configurable, so the raw score leads and the percentage supports it. */
  protected score(assessment: AssessmentRecord): string {
    return `${assessment.averageScore} / ${assessment.maxScore}`;
  }

  /** The class average in the school's grading scale (63-academic-settings.md). */
  protected shareResult(assessment: AssessmentRecord): string {
    const settings = this.academicSettings.settings();
    const share = assessment.maxScore ? (assessment.averageScore / assessment.maxScore) * 100 : 0;
    return formatResult(share, settings.gradingScale, settings.passMark);
  }
  /** An assessment is set for a class that actually runs - chosen by id, which is what it stores. */
  protected readonly classOptions = computed(() =>
    this.classGroupService
      .classes()
      .map((group) => ({ label: group.name, value: group.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);
  private readonly permissions = inject(PermissionService);

  /** Marking is editing the assessment, and marks are the Grades feature, not Exams. */
  protected readonly canMark = computed(
    () =>
      this.permissions.can(this.permissions.currentModule(), PermissionAction.Edit) &&
      this.permissions.planIncludes('GRADES'),
  );
  protected readonly marksVisible = signal(false);
  protected readonly marking = signal<AssessmentRecord | null>(null);

  protected openMarks(assessment: AssessmentRecord): void {
    this.marking.set(assessment);
    this.marksVisible.set(true);
  }

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<AssessmentRecord | null>(null);

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(assessment: AssessmentRecord): void {
    this.editing.set(assessment);
    this.formVisible.set(true);
  }

  protected onSaved(assessment: AssessmentRecord): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.assessmentService.save(assessment), {
      success: 'Assessment saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<AssessmentRecord | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: AssessmentRecord): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: AssessmentRecord): RecordDetail {
    return {
      title: r.name,
      subtitle: [r.subject, r.className].filter(Boolean).join(' · '),
      badge: r.graded ? { label: 'Graded', severity: 'success' } : { label: 'Not graded', severity: 'secondary' },
      facts: [
        { label: 'Type', value: humanize(String(r.type)) },
        { label: 'Date', value: readableDate(r.date) },
        { label: 'Subject', value: r.subject },
        { label: 'Class', value: r.className },
        { label: 'Out of', value: r.maxScore },
        // An average over nothing marked would read as a real zero.
        { label: 'Class average', value: r.graded ? r.averageScore : null },
      ],
    };
  }

  protected confirmRemove(record: AssessmentRecord, name: string): void {
    this.removal.confirm({
      noun: 'assessment',
      name,
      remove: () => this.assessmentService.remove(record.id),
    });
  }
}
