import { Injectable, signal } from '@angular/core';
import { Fee, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

function fee(id: string, name: string, category: string, amount: number, description: string, status = Status.Active): Fee {
  return { id, branchId: 'branch-1', academicYearId: 'ay-2026', name, category, amount, description, status };
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly _fees = signal<Fee[]>([
    fee('fee-01', 'Tuition — Primary', 'Tuition', 1200, 'Annual tuition for grades 1 to 6.'),
    fee('fee-02', 'Tuition — Secondary', 'Tuition', 1600, 'Annual tuition for grades 7 and 8.'),
    fee('fee-03', 'Registration', 'Registration', 150, 'One-off enrolment fee for new students.'),
    fee('fee-04', 'Re-registration', 'Registration', 75, 'Annual renewal for returning students.'),
    fee('fee-05', 'Transportation — Zone A', 'Transportation', 300, 'Bus service within 5km of campus.'),
    fee('fee-06', 'Transportation — Zone B', 'Transportation', 450, 'Bus service beyond 5km of campus.'),
    fee('fee-07', 'Laboratory', 'Laboratory', 120, 'Science laboratory consumables and equipment.'),
    fee('fee-08', 'Computer Lab', 'Laboratory', 100, 'Technology lab access and software licences.'),
    fee('fee-09', 'Textbooks', 'Materials', 180, 'Course books and workbooks for the year.'),
    fee('fee-10', 'Uniform', 'Materials', 90, 'Two sets of school uniform.'),
    fee('fee-11', 'Examination', 'Examination', 60, 'End-of-year examination administration.'),
    fee('fee-12', 'Sports & Activities', 'Activities', 110, 'Clubs, sports teams and equipment.'),
    fee('fee-13', 'Field Trips', 'Activities', 140, 'Curriculum-linked excursions.'),
    fee('fee-14', 'Language Course — Term', 'Tuition', 320, 'One ten-week term at the language centre.'),
    fee('fee-15', 'Late Payment', 'Penalty', 25, 'Applied after 30 days overdue.', Status.Inactive),
  ]);

  readonly fees = this._fees.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: Fee): void {
    this._fees.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._fees.update((current) => removeById(current, id));
  }
}
