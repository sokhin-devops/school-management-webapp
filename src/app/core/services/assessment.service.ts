import { Injectable, signal } from '@angular/core';
import { removeById, upsertById } from '../utils/collection';

/**
 * 31-exams-and-grades.md. No Assessment model exists in core/models yet, so the
 * shape lives here alongside its mock data, the way StudentRecord does.
 */
export type AssessmentType = 'Quiz' | 'Midterm' | 'Final' | 'Assignment';

export interface AssessmentRecord {
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly className: string;
  readonly type: AssessmentType;
  readonly date: string;
  readonly maxScore: number;
  readonly averageScore: number;
  readonly graded: boolean;
}

function assessment(
  id: string,
  name: string,
  subject: string,
  className: string,
  type: AssessmentType,
  date: string,
  maxScore: number,
  averageScore: number,
  graded = true,
): AssessmentRecord {
  return { id, name, subject, className, type, date, maxScore, averageScore, graded };
}

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly _assessments = signal<AssessmentRecord[]>([
    assessment('as-01', 'Algebra Unit Test', 'Mathematics', 'Grade 7 - A', 'Quiz', '2026-09-04', 50, 38),
    assessment('as-02', 'Mechanics Midterm', 'Physics', 'Grade 8 - A', 'Midterm', '2026-09-07', 100, 69),
    assessment('as-03', 'Periodic Table Quiz', 'Chemistry', 'Grade 7 - B', 'Quiz', '2026-09-08', 25, 19),
    assessment('as-04', 'Cell Structure Assignment', 'Biology', 'Grade 6 - A', 'Assignment', '2026-09-09', 40, 33),
    assessment('as-05', 'Comprehension Test', 'English', 'Grade 5 - A', 'Quiz', '2026-09-10', 50, 41),
    assessment('as-06', 'Poetry Essay', 'Literature', 'Grade 8 - B', 'Assignment', '2026-09-11', 60, 44),
    assessment('as-07', 'World War II Test', 'History', 'Grade 7 - A', 'Midterm', '2026-09-14', 100, 71),
    assessment('as-08', 'Map Skills Quiz', 'Geography', 'Grade 6 - B', 'Quiz', '2026-09-15', 30, 23),
    assessment('as-09', 'Python Basics Project', 'Computer Science', 'Grade 8 - A', 'Assignment', '2026-09-16', 100, 82),
    assessment('as-10', 'Supply and Demand Test', 'Economics', 'Grade 8 - B', 'Midterm', '2026-09-17', 100, 68),
    assessment('as-11', 'Fractions Assessment', 'Mathematics', 'Grade 4 - A', 'Quiz', '2026-09-18', 40, 31),
    assessment('as-12', 'End of Term Examination', 'Mathematics', 'Grade 7 - A', 'Final', '2026-09-25', 100, 0, false),
    assessment('as-13', 'End of Term Examination', 'Physics', 'Grade 8 - A', 'Final', '2026-09-26', 100, 0, false),
    assessment('as-14', 'Speaking Assessment', 'English', 'Intermediate - Batch 03', 'Final', '2026-09-28', 50, 0, false),
  ]);

  readonly assessments = this._assessments.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: AssessmentRecord): void {
    this._assessments.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._assessments.update((current) => removeById(current, id));
  }
}
