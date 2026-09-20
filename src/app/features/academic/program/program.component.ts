import { Component, inject } from '@angular/core';
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
import { ProgramService } from '../../../core/services/program.service';
import { Program, Status } from '../../../core/models';

/** 21-programs.md — programs suit universities, colleges and training centers. */
@Component({
  selector: 'app-program',
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
  templateUrl: './program.component.html',
  styleUrl: './program.component.scss',
})
export class ProgramComponent {
  private readonly programService = inject(ProgramService);

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
}
