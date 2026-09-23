import { Injectable, signal } from '@angular/core';
import { Status, Subject } from '../models';
import { removeById, upsertById } from '../utils/collection';

function subject(id: string, name: string, code: string, description: string, status = Status.Active): Subject {
  return { id, branchId: 'branch-1', name, code, description, status };
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly _subjects = signal<Subject[]>([
    subject('sub-01', 'Mathematics', 'MATH', 'Core mathematics across all levels.'),
    subject('sub-02', 'Physics', 'PHY', 'Mechanics, electricity and modern physics.'),
    subject('sub-03', 'Chemistry', 'CHEM', 'Organic and inorganic chemistry with laboratory work.'),
    subject('sub-04', 'Biology', 'BIO', 'Life sciences and human biology.'),
    subject('sub-05', 'English', 'ENG', 'Language, comprehension and composition.'),
    subject('sub-06', 'Literature', 'LIT', 'Prose, poetry and critical reading.'),
    subject('sub-07', 'History', 'HIST', 'World and regional history.'),
    subject('sub-08', 'Geography', 'GEO', 'Physical and human geography.'),
    subject('sub-09', 'Computer Science', 'CS', 'Programming, algorithms and databases.'),
    subject('sub-10', 'Economics', 'ECON', 'Micro and macroeconomics.'),
    subject('sub-11', 'Visual Arts', 'ART', 'Drawing, painting and design.'),
    subject('sub-12', 'Music', 'MUS', 'Theory, performance and ensemble.'),
    subject('sub-13', 'Drama', 'DRA', 'Performance and stagecraft.', Status.Inactive),
    subject('sub-14', 'Sports', 'PE', 'Physical education and team sports.'),
    subject('sub-15', 'French', 'FRE', 'Beginner to intermediate French.'),
    subject('sub-16', 'Spanish', 'SPA', 'Beginner to intermediate Spanish.', Status.Inactive),
  ]);

  readonly subjects = this._subjects.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: Subject): void {
    this._subjects.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._subjects.update((current) => removeById(current, id));
  }
}
