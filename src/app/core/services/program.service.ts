import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Program } from '../models';
import { ApiProgram } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT /api/v1/programs accept. */
interface ProgramWrite {
  branchId?: string;
  name: string;
  code: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly resource = createBranchResource<ApiProgram, ProgramWrite>('api/v1/programs');

  readonly programs = computed(() => this.resource.items().map(toProgram));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(program: Program): Observable<ApiProgram> {
    const body = toWrite(program);
    return program.id ? this.resource.update(program.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toProgram(program: ApiProgram): Program {
  return {
    id: program.id,
    branchId: program.branchId,
    name: program.name,
    code: program.code,
    description: program.description ?? undefined,
    status: toStatus(program.status),
  };
}

function toWrite(program: Program): ProgramWrite {
  return {
    name: program.name,
    // Optional on the screen's model, required by the API. Sent as written
    // rather than defaulted, so a blank one is refused with a message about the
    // field instead of being quietly saved as an empty code.
    code: program.code ?? '',
    description: program.description ?? null,
    status: fromStatus(program.status),
  };
}
