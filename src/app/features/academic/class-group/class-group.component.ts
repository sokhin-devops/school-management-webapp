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
import { ClassGroupRecord, ClassGroupService } from '../../../core/services/class-group.service';
import { Status } from '../../../core/models';

type Fill = 'ok' | 'warning' | 'critical';

/**
 * 23-classes.md — classes must express several structures, so the columns are
 * Level and Program rather than a hard-coded "Grade".
 */
@Component({
  selector: 'app-class-group',
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
  templateUrl: './class-group.component.html',
  styleUrl: './class-group.component.scss',
})
export class ClassGroupComponent {
  private readonly classGroupService = inject(ClassGroupService);

  protected readonly levelFilter = new RecordFilter<ClassGroupRecord, string>(
    (group, value) => group.levelName === value,
  );

  protected readonly statusFilter = new RecordFilter<ClassGroupRecord, Status>(
    (group, value) => group.status === value,
  );

  protected readonly records = createRecordList<ClassGroupRecord>({
    source: this.classGroupService.classes,
    searchKeys: [
      (group) => group.name,
      (group) => group.code,
      (group) => group.levelName,
      (group) => group.programName,
      (group) => group.teacherName,
    ],
    sortKeys: {
      name: (group) => group.name,
      levelName: (group) => group.levelName,
      teacherName: (group) => group.teacherName,
      enrolled: (group) => group.enrolled,
      status: (group) => group.status,
    },
    defaultSortField: 'name',
    filters: [this.levelFilter, this.statusFilter] as never[],
    noun: { one: 'class', many: 'classes' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly levelOptions = computed(() =>
    Array.from(new Set(this.classGroupService.classes().map((group) => group.levelName)))
      .sort((a, b) => a.localeCompare(b))
      .map((levelName) => ({ label: levelName, value: levelName })),
  );

  protected percentFull(group: ClassGroupRecord): number {
    const capacity = group.capacity ?? 0;
    return capacity ? Math.round((group.enrolled / capacity) * 100) : 0;
  }

  protected fill(group: ClassGroupRecord): Fill {
    const percent = this.percentFull(group);
    return percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : 'ok';
  }
}
