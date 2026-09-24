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
} from '../../share/components';
import { RecordFilter, createRecordList } from '../../share/data/record-list';
import { percent } from '../../share/data/format';
import { AssessmentRecord, AssessmentService, AssessmentType } from '../../core/services/assessment.service';
import { AssessmentFormComponent } from './assessment-form/assessment-form.component';
import { ClassGroupService } from '../../core/services/class-group.service';
import { openOnQuickAdd } from '../../core/services/quick-add.service';
import { SubjectService } from '../../core/services/subject.service';
import { describeFailure } from '../../core/api/api-failure';

/** 31-exams-and-grades.md — assessments, scores and results. */
@Component({
  selector: 'app-exam',
  imports: [
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
  ],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss',
})
export class ExamComponent {
  protected readonly assessmentService = inject(AssessmentService);
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

  protected sharePercent(assessment: AssessmentRecord): string {
    return percent(assessment.maxScore ? (assessment.averageScore / assessment.maxScore) * 100 : 0, 0);
  }
  /** An assessment is set for a class that actually runs. */
  protected readonly classOptions = computed(() =>
    this.classGroupService
      .classes()
      .map((group) => ({ label: group.name, value: group.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

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
    this.assessmentService.save(assessment).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
