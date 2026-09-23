import { Injectable, signal } from '@angular/core';
import { Program, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

function program(id: string, name: string, code: string, description: string, status = Status.Active): Program {
  return { id, branchId: 'branch-1', name, code, description, status };
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly _programs = signal<Program[]>([
    program('prg-01', 'General Secondary', 'GEN-SEC', 'Standard secondary curriculum, grades 7 to 12.'),
    program('prg-02', 'Primary Education', 'PRI', 'Foundation years, grades 1 to 6.'),
    program('prg-03', 'English Language', 'ELP', 'Four-level general English programme.'),
    program('prg-04', 'Business Foundation', 'BUS-F', 'One-year preparatory business programme.'),
    program('prg-05', 'Computer Science', 'CS', 'Applied computing and software development.'),
    program('prg-06', 'Vocational Trades', 'VOC', 'Practical trades certification.', Status.Inactive),
    program('prg-07', 'Early Years', 'EY', 'Kindergarten and pre-primary.'),
    program('prg-08', 'Exam Preparation', 'PREP', 'IELTS and university entrance preparation.'),
    program('prg-09', 'Teacher Training', 'TT', 'Professional development for teaching staff.', Status.Inactive),
    program('prg-10', 'Summer School', 'SUM', 'Short intensive courses over the summer break.'),
  ]);

  readonly programs = this._programs.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: Program): void {
    this._programs.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._programs.update((current) => removeById(current, id));
  }
}
