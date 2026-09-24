import { Component, computed, inject, signal } from '@angular/core';
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
import { RoomFormComponent } from './room-form/room-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';

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
    RoomFormComponent,
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  protected readonly roomService = inject(RoomService);

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
  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<RoomRecord | null>(null);

  constructor() {
    openOnQuickAdd('room', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(room: RoomRecord): void {
    this.editing.set(room);
    this.formVisible.set(true);
  }

  protected onSaved(room: RoomRecord): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.roomService.save(room).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
