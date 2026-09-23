import { Injectable, signal } from '@angular/core';
import { ClassGroup, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

/**
 * 23-classes.md: the same shape must express Grade 1 to 1-A, Program to Year 2 to
 * Section A, and Course to Intermediate to Batch 03 — so nothing here hard-codes
 * the word Grade. The level and program names are denormalized for display.
 */
export interface ClassGroupRecord extends ClassGroup {
  levelName: string;
  programName: string;
  academicYearName: string;
  teacherName: string;
  enrolled: number;
}

function classGroup(
  id: string,
  name: string,
  code: string,
  levelName: string,
  programName: string,
  teacherName: string,
  enrolled: number,
  capacity: number,
  status = Status.Active,
): ClassGroupRecord {
  return {
    id,
    branchId: 'branch-1',
    academicYearId: 'ay-2026',
    academicYearName: '2026 - 2027',
    name,
    code,
    levelName,
    programName,
    teacherName,
    enrolled,
    capacity,
    status,
  };
}

@Injectable({ providedIn: 'root' })
export class ClassGroupService {
  private readonly _classes = signal<ClassGroupRecord[]>([
    classGroup('cls-01', 'Grade 1 - A', '1A', 'Grade 1', 'Primary Education', 'Rachel Owusu', 32, 35),
    classGroup('cls-02', 'Grade 1 - B', '1B', 'Grade 1', 'Primary Education', 'Priya Raman', 30, 35),
    classGroup('cls-03', 'Grade 2 - A', '2A', 'Grade 2', 'Primary Education', 'Amara Diallo', 28, 35),
    classGroup('cls-04', 'Grade 2 - B', '2B', 'Grade 2', 'Primary Education', 'Marcus Bennett', 26, 35),
    classGroup('cls-05', 'Grade 3 - A', '3A', 'Grade 3', 'Primary Education', 'Chen Wei', 31, 35),
    classGroup('cls-06', 'Grade 3 - B', '3B', 'Grade 3', 'Primary Education', 'Nadia Haddad', 29, 35),
    classGroup('cls-07', 'Grade 4 - A', '4A', 'Grade 4', 'Primary Education', 'Daniel Ferreira', 33, 35),
    classGroup('cls-08', 'Grade 4 - B', '4B', 'Grade 4', 'Primary Education', 'Helen Castillo', 27, 35),
    classGroup('cls-09', 'Grade 5 - A', '5A', 'Grade 5', 'Primary Education', 'Tomas Novak', 30, 35),
    classGroup('cls-10', 'Grade 5 - B', '5B', 'Grade 5', 'Primary Education', 'Grace Mwangi', 25, 35),
    classGroup('cls-11', 'Grade 6 - A', '6A', 'Grade 6', 'Primary Education', 'Peter Lindqvist', 34, 35),
    classGroup('cls-12', 'Grade 6 - B', '6B', 'Grade 6', 'Primary Education', 'Ibrahim Toure', 28, 35),
    classGroup('cls-13', 'Grade 7 - A', '7A', 'Grade 7', 'General Secondary', 'Rachel Owusu', 35, 35),
    classGroup('cls-14', 'Grade 7 - B', '7B', 'Grade 7', 'General Secondary', 'Daniel Ferreira', 31, 35),
    classGroup('cls-15', 'Grade 8 - A', '8A', 'Grade 8', 'General Secondary', 'Amara Diallo', 24, 30),
    classGroup('cls-16', 'Grade 8 - B', '8B', 'Grade 8', 'General Secondary', 'Priya Raman', 21, 30),
    classGroup('cls-17', 'Intermediate - Batch 03', 'INT-03', 'Intermediate', 'English Language', 'Nadia Haddad', 18, 24),
    classGroup('cls-18', 'Beginner - Batch 01', 'BEG-01', 'Beginner', 'English Language', 'Priya Raman', 14, 24, Status.Inactive),
  ]);

  readonly classes = this._classes.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: ClassGroupRecord): void {
    this._classes.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._classes.update((current) => removeById(current, id));
  }
}
