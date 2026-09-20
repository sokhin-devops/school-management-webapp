import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { RoomRecord, RoomService } from '../../../core/services/room.service';
import { Status } from '../../../core/models';

/** 26-rooms.md — rooms are independent resources, never a permanent child of a class. */
@Component({
  selector: 'app-room',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  private readonly roomService = inject(RoomService);

  protected readonly kindFilter = new RecordFilter<RoomRecord, string>((room, value) => room.kind === value);
  protected readonly statusFilter = new RecordFilter<RoomRecord, Status>((room, value) => room.status === value);

  protected readonly records = createRecordList<RoomRecord>({
    source: this.roomService.rooms,
    searchKeys: [
      (room) => room.name,
      (room) => room.code,
      (room) => room.building,
      (room) => room.kind,
    ],
    sortKeys: {
      name: (room) => room.name,
      code: (room) => room.code ?? '',
      building: (room) => room.building,
      capacity: (room) => room.capacity ?? 0,
      status: (room) => room.status,
    },
    defaultSortField: 'name',
    filters: [this.kindFilter, this.statusFilter] as never[],
    noun: { one: 'room', many: 'rooms' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly kindOptions = computed(() =>
    Array.from(new Set(this.roomService.rooms().map((room) => room.kind)))
      .sort((a, b) => a.localeCompare(b))
      .map((kind) => ({ label: kind, value: kind })),
  );
}
