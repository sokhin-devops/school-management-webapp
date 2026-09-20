import { Component, computed, inject } from '@angular/core';
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
  ],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss',
})
export class ExamComponent {
  private readonly assessmentService = inject(AssessmentService);

  protected readonly subjectFilter = new RecordFilter<AssessmentRecord, string>(
    (assessment, value) => assessment.subject === value,
  );

  protected readonly typeFilter = new RecordFilter<AssessmentRecord, AssessmentType>(
    (assessment, value) => assessment.type === value,
  );

  protected readonly records = createRecordList<AssessmentRecord>({
    source: this.assessmentService.assessments,
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

  protected readonly subjectOptions = computed(() =>
    Array.from(new Set(this.assessmentService.assessments().map((assessment) => assessment.subject)))
      .sort((a, b) => a.localeCompare(b))
      .map((subject) => ({ label: subject, value: subject })),
  );

  constructor() {
    this.records.sortOrder.set(-1);
  }

  /** 31-exams-and-grades.md: grading scales are configurable, so the raw score leads and the percentage supports it. */
  protected score(assessment: AssessmentRecord): string {
    return `${assessment.averageScore} / ${assessment.maxScore}`;
  }

  protected sharePercent(assessment: AssessmentRecord): string {
    return percent(assessment.maxScore ? (assessment.averageScore / assessment.maxScore) * 100 : 0, 0);
  }
}
