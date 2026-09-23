import { Injectable, signal } from '@angular/core';
import { Level, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

/** 22-levels.md: `displayLabel` carries the per-school terminology (Grade / Level / Year). */
export interface LevelRecord extends Level {
  programName: string;
}

function level(
  id: string,
  order: number,
  name: string,
  displayLabel: string,
  programName: string,
  status = Status.Active,
): LevelRecord {
  return { id, branchId: 'branch-1', name, displayLabel, order, programName, status };
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private readonly _levels = signal<LevelRecord[]>([
    level('lvl-01', 1, 'Grade 1', 'Grade', 'Primary Education'),
    level('lvl-02', 2, 'Grade 2', 'Grade', 'Primary Education'),
    level('lvl-03', 3, 'Grade 3', 'Grade', 'Primary Education'),
    level('lvl-04', 4, 'Grade 4', 'Grade', 'Primary Education'),
    level('lvl-05', 5, 'Grade 5', 'Grade', 'Primary Education'),
    level('lvl-06', 6, 'Grade 6', 'Grade', 'Primary Education'),
    level('lvl-07', 7, 'Grade 7', 'Grade', 'General Secondary'),
    level('lvl-08', 8, 'Grade 8', 'Grade', 'General Secondary'),
    level('lvl-09', 9, 'Beginner', 'Level', 'English Language'),
    level('lvl-10', 10, 'Elementary', 'Level', 'English Language'),
    level('lvl-11', 11, 'Intermediate', 'Level', 'English Language'),
    level('lvl-12', 12, 'Advanced', 'Level', 'English Language', Status.Inactive),
  ]);

  readonly levels = this._levels.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: LevelRecord): void {
    this._levels.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._levels.update((current) => removeById(current, id));
  }
}
