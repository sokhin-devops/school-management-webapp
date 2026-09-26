import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiAssessment, ApiAssessmentType } from '../api/api.models';
import { createBranchResource } from '../api/branch-resource';
import { ApiClientService } from './api-client.service';

/**
 * 31-exams-and-grades.md. No Assessment model exists in core/models, so the
 * shape lives here alongside the service, the way StudentRecord does.
 */
export type AssessmentType = 'Quiz' | 'Midterm' | 'Final' | 'Assignment';

export interface AssessmentRecord {
  id: string;
  name: string;
  /** Names, resolved by the page; the API stores and returns the ids below. */
  subject: string;
  className: string;
  subjectId: string;
  classGroupId: string;
  academicYearId?: string;
  type: AssessmentType;
  date: string;
  maxScore: number;
  /** Both come from the mark sheet and are never written from this side. */
  averageScore: number;
  graded: boolean;
}

/** The body POST and PUT /api/v1/assessments accept. */
interface AssessmentWrite {
  branchId?: string;
  academicYearId: string | null;
  classGroupId: string;
  subjectId: string;
  name: string;
  type: ApiAssessmentType;
  assessedOn: string;
  maxScore: number;
}

/** One student's line on a mark sheet; a null score is a student not marked. */
export interface MarkEntry {
  studentId: string;
  score: number | null;
  remark: string | null;
}

/** com.school_management_webapi.dto.response.AssessmentScoreSheetResponse */
export interface MarkSheet {
  assessmentId: string;
  maxScore: number;
  averageScore: number | null;
  graded: boolean;
  scores: (MarkEntry & { id: string })[];
}

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly api = inject(ApiClientService);
  private readonly resource = createBranchResource<ApiAssessment, AssessmentWrite>('api/v1/assessments');

  readonly assessments = computed(() => this.resource.items().map(toAssessment));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  save(record: AssessmentRecord): Observable<ApiAssessment> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }

  markSheet(assessmentId: string): Observable<MarkSheet> {
    return this.api.get<MarkSheet>(`api/v1/assessments/${assessmentId}/scores`);
  }

  /**
   * Replaces the whole sheet, as the API does. The list is reloaded after, since
   * the average and the graded flag it shows are worked out from the marks.
   */
  saveMarks(assessmentId: string, scores: MarkEntry[]): Observable<MarkSheet> {
    return this.api
      .put<MarkSheet>(`api/v1/assessments/${assessmentId}/scores`, { scores })
      .pipe(tap(() => this.resource.reload()));
  }
}

function toAssessment(record: ApiAssessment): AssessmentRecord {
  return {
    id: record.id,
    name: record.name,
    subject: '',
    className: '',
    subjectId: record.subjectId,
    classGroupId: record.classGroupId,
    academicYearId: record.academicYearId ?? undefined,
    type: toType(record.type),
    date: record.assessedOn,
    maxScore: record.maxScore,
    // Null until somebody marks it, which the screens show as nothing rather
    // than as a score of zero.
    averageScore: record.averageScore ?? 0,
    graded: record.graded ?? false,
  };
}

function toWrite(record: AssessmentRecord): AssessmentWrite {
  return {
    academicYearId: record.academicYearId ?? null,
    classGroupId: record.classGroupId,
    subjectId: record.subjectId,
    name: record.name,
    type: record.type.toUpperCase() as ApiAssessmentType,
    assessedOn: record.date,
    maxScore: record.maxScore,
  };
}

/** QUIZ to Quiz. The screens title-case these and the API shouts them. */
function toType(type: ApiAssessmentType): AssessmentType {
  return (type.charAt(0) + type.slice(1).toLowerCase()) as AssessmentType;
}
