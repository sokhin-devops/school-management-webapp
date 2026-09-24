import { Injectable, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from '../models';

export interface RoomRecord extends Room {
  building: string;
  kind: string;
}
import { ApiRoom } from '../api/api.models';
import { fromStatus, toStatus } from '../api/api-mappers';
import { createBranchResource } from '../api/branch-resource';

/** The body POST and PUT api/v1/rooms accept. */
interface RoomWrite {
  branchId?: string;
  name: string;
  code: string;
  building: string | null;
  kind: string | null;
  capacity: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly resource = createBranchResource<ApiRoom, RoomWrite>('api/v1/rooms');

  readonly rooms = computed(() => this.resource.items().map(toRoom));
  readonly loading = this.resource.loading;
  readonly loaded = this.resource.loaded;
  readonly error = this.resource.error;

  reload(): void {
    this.resource.reload();
  }

  /** One call for both: the page does not have to know which it is doing. */
  save(record: RoomRecord): Observable<ApiRoom> {
    const body = toWrite(record);
    return record.id ? this.resource.update(record.id, body) : this.resource.create(body);
  }

  remove(id: string): Observable<void> {
    return this.resource.remove(id);
  }
}

function toRoom(record: ApiRoom): RoomRecord {
  return {
    id: record.id,
    branchId: record.branchId,
    name: record.name,
    code: record.code,
    building: record.building ?? '',
    kind: record.kind ?? '',
    capacity: record.capacity ?? undefined,
    status: toStatus(record.status),
  };
}

function toWrite(record: RoomRecord): RoomWrite {
  return {
    name: record.name,
    code: record.code ?? '',
    building: record.building || null,
    kind: record.kind || null,
    capacity: record.capacity ?? null,
    status: fromStatus(record.status),
  };
}
