import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Level } from '../models';

/** A level with the programme's name resolved, which is what the list shows. */
export interface LevelRecord extends Level {
  programName: string;
}
import { ApiLevel } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/levels accept. */
interface LevelWrite {
  branchId?: string;
  programId: string | null;
  name: string;
  displayLabel: string | null;
  order: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private readonly resource = createBranchResource<ApiLevel, LevelWrite>('api/v1/levels');

  readonly levels = computed(() => this.resource.items().map(toLevel));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: LevelRecord): Observable<ApiLevel> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toLevel(record: ApiLevel): LevelRecord {
  return {
    id: record.id,
    branchId: record.branchId,
    programId: record.programId ?? undefined,
    // Resolved by the page, which has the programmes; the API sends the id only.
    programName: '',
    name: record.name,
    displayLabel: record.displayLabel ?? undefined,
    order: record.order ?? undefined,
    status: toStatus(record.status),
  };
}

function toWrite(record: LevelRecord): LevelWrite {
  return {
    programId: record.programId ?? null,
    name: record.name,
    displayLabel: record.displayLabel ?? null,
    order: record.order ?? null,
    status: fromStatus(record.status),
  };
}
