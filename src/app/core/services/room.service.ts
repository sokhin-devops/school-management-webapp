import { Injectable, signal } from '@angular/core';
import { Room, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

/** 26-rooms.md: rooms are independent resources, never a permanent child of a class. */
export interface RoomRecord extends Room {
  building: string;
  kind: string;
}

function room(id: string, name: string, code: string, building: string, kind: string, capacity: number, status = Status.Active): RoomRecord {
  return { id, branchId: 'branch-1', name, code, building, kind, capacity, status };
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly _rooms = signal<RoomRecord[]>([
    room('rm-01', 'Room 101', 'R101', 'Main Block', 'Classroom', 35),
    room('rm-02', 'Room 102', 'R102', 'Main Block', 'Classroom', 35),
    room('rm-03', 'Room 201', 'R201', 'Main Block', 'Classroom', 30),
    room('rm-04', 'Physics Lab', 'LAB-P', 'Science Wing', 'Laboratory', 24),
    room('rm-05', 'Chemistry Lab', 'LAB-C', 'Science Wing', 'Laboratory', 24),
    room('rm-06', 'Biology Lab', 'LAB-B', 'Science Wing', 'Laboratory', 24),
    room('rm-07', 'Computer Lab 1', 'LAB-IT1', 'Technology Block', 'Laboratory', 30),
    room('rm-08', 'Computer Lab 2', 'LAB-IT2', 'Technology Block', 'Laboratory', 30, Status.Inactive),
    room('rm-09', 'Library', 'LIB', 'Main Block', 'Study', 60),
    room('rm-10', 'Music Room', 'MUS', 'Arts Block', 'Studio', 20),
    room('rm-11', 'Art Studio', 'ART', 'Arts Block', 'Studio', 22),
    room('rm-12', 'Auditorium', 'AUD', 'Main Block', 'Hall', 250),
    room('rm-13', 'Sports Hall', 'GYM', 'Sports Centre', 'Hall', 120),
    room('rm-14', 'Meeting Room', 'MTG', 'Administration', 'Meeting', 12),
  ]);

  readonly rooms = this._rooms.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: RoomRecord): void {
    this._rooms.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._rooms.update((current) => removeById(current, id));
  }
}
