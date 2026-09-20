import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
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
import { LevelRecord, LevelService } from '../../../core/services/level.service';
import { Status } from '../../../core/models';

/**
 * 22-levels.md — configurable academic stages. The displayed terminology is the
 * school's own (Grade / Level / Year), which is why it is a column rather than a
 * word baked into the headings.
 */
@Component({
  selector: 'app-level',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
  ],
  templateUrl: './level.component.html',
  styleUrl: './level.component.scss',
})
export class LevelComponent {
  private readonly levelService = inject(LevelService);

  protected readonly programFilter = new RecordFilter<LevelRecord, string>(
    (level, value) => level.programName === value,
  );

  protected readonly statusFilter = new RecordFilter<LevelRecord, Status>(
    (level, value) => level.status === value,
  );

  protected readonly records = createRecordList<LevelRecord>({
    source: this.levelService.levels,
    searchKeys: [
      (level) => level.name,
      (level) => level.displayLabel,
      (level) => level.programName,
    ],
    sortKeys: {
      order: (level) => level.order ?? 0,
      name: (level) => level.name,
      programName: (level) => level.programName,
      status: (level) => level.status,
    },
    defaultSortField: 'order',
    filters: [this.programFilter, this.statusFilter] as never[],
    noun: { one: 'level', many: 'levels' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly programOptions = computed(() =>
    Array.from(new Set(this.levelService.levels().map((level) => level.programName)))
      .sort((a, b) => a.localeCompare(b))
      .map((programName) => ({ label: programName, value: programName })),
  );
}
