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
  RecordDrawerComponent,
  type RecordDetail,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { ProgramService } from '../../../core/services/program.service';
import { Program, Status } from '../../../core/models';
import { ProgramFormComponent } from './program-form/program-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { CanDirective } from '../../../share/directives/can.directive';
import { SaveState } from '../../../share/data/save-state';
import { RecordRemovalService } from '../../../share/data/record-removal.service';
import { statusBadge } from '../../../share/data/format';

/** 21-programs.md — programs suit universities, colleges and training centers. */
@Component({
  selector: 'app-program',
  providers: [SaveState],
  imports: [CanDirective, 
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
    ProgramFormComponent,
    RecordDrawerComponent,
  ],
  templateUrl: './program.component.html',
  styleUrl: './program.component.scss',
})
export class ProgramComponent {
  protected readonly programService = inject(ProgramService);

  protected readonly statusFilter = new RecordFilter<Program, Status>(
    (program, value) => program.status === value,
  );

  protected readonly records = createRecordList<Program>({
    source: this.programService.programs,
    searchKeys: [(program) => program.name, (program) => program.code, (program) => program.description],
    sortKeys: {
      name: (program) => program.name,
      code: (program) => program.code ?? '',
      status: (program) => program.status,
    },
    defaultSortField: 'name',
    filters: [this.statusFilter] as never[],
    noun: { one: 'program', many: 'programs' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];
  protected readonly saveState = inject(SaveState);
  private readonly removal = inject(RecordRemovalService);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<Program | null>(null);

  constructor() {
    openOnQuickAdd('program', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(program: Program): void {
    this.editing.set(program);
    this.formVisible.set(true);
  }

  protected onSaved(program: Program): void {
    // The list reloads itself once the server has the record, so what is on
    // screen is what was actually saved rather than what was sent.
    this.saveState.run(this.programService.save(program), {
      success: 'Program saved',
      done: () => this.formVisible.set(false),
    });
  }

  /** The record the drawer is showing; kept after it closes so the slide-out is not blank. */
  protected readonly viewing = signal<Program | null>(null);
  protected readonly viewVisible = signal(false);
  protected readonly viewDetail = computed(() => {
    const record = this.viewing();
    return record ? this.describe(record) : null;
  });

  protected openView(record: Program): void {
    this.viewing.set(record);
    this.viewVisible.set(true);
  }

  private describe(r: Program): RecordDetail {
    return {
      title: r.name,
      subtitle: r.code,
      badge: statusBadge(r.status),
      facts: [
        { label: 'Code', value: r.code },
        { label: 'Description', value: r.description, wide: true },
      ],
    };
  }

  protected confirmRemove(record: Program, name: string): void {
    this.removal.confirm({
      noun: 'program',
      name,
      remove: () => this.programService.remove(record.id),
    });
  }
}
