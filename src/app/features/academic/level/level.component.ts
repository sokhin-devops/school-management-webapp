import { Component, computed, inject, signal } from '@angular/core';
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
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { LevelRecord, LevelService } from '../../../core/services/level.service';
import { Status } from '../../../core/models';
import { LevelFormComponent } from './level-form/level-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { ProgramService } from '../../../core/services/program.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { statusBadge } from '../../../share/data/format';

/**
 * 22-levels.md — configurable academic stages. The displayed terminology is the
 * school's own (Grade / Level / Year), which is why it is a column rather than a
 * word baked into the headings.
 */
@Component({
  selector: 'app-level',
  providers: [SaveState],
  imports: [CanDirective, 
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
    LevelFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './level.component.html',
  styleUrl: './level.component.scss',
})
export class LevelComponent {
  protected readonly levelService = inject(LevelService);
  private readonly programService = inject(ProgramService);

  protected readonly programFilter = new RecordFilter<LevelRecord, string>(
    (level, value) => level.programName === value,
  );

  protected readonly statusFilter = new RecordFilter<LevelRecord, Status>(
    (level, value) => level.status === value,
  );

  /** The API stores programId; the table shows the programme's name. */
  private readonly named = computed<LevelRecord[]>(() => {
    const programs = new Map(this.programService.programs().map((program) => [program.id, program.name]));
    return this.levelService.levels().map((level) => ({
      ...level,
      programName: level.programId ? (programs.get(level.programId) ?? '') : '',
    }));
  });

  protected readonly records = createRecordList<LevelRecord>({
    source: this.named,
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
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<LevelRecord | null>(null);

  constructor() {
    openOnQuickAdd('level', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(level: LevelRecord): void {
    this.editing.set(level);
    this.formVisible.set(true);
  }

  protected onSaved(level: LevelRecord): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.levelService.save(level), {
      success: 'Level saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<LevelRecord | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: LevelRecord): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: LevelRecord): RecordDetail {
    return {
      title: r.name,
      subtitle: r.displayLabel,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Program', value: r.programName },
        { label: 'Order', value: r.order },
      ],
    };
  }

  protected confirmRemove(record: LevelRecord, name: string): void {
    this.removal.confirm({
      noun: 'level',
      name,
      remove: () => this.levelService.remove(record.id),
    });
  }
}
