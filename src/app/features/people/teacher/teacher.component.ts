import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { DataViewModule } from 'primeng/dataview';
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
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { TeacherRecord, TeacherService } from '../../../core/services/teacher.service';
import { Status } from '../../../core/models';
import { TeacherCardComponent } from './teacher-card/teacher-card.component';

@Component({
  selector: 'app-teacher',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    AvatarModule,
    DataViewModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
    TeacherCardComponent,
  ],
  templateUrl: './teacher.component.html',
  styleUrl: './teacher.component.scss',
})
export class TeacherComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly teacherService = inject(TeacherService);

  protected readonly departmentFilter = new RecordFilter<TeacherRecord, string>(
    (teacher, value) => teacher.department === value,
  );

  protected readonly statusFilter = new RecordFilter<TeacherRecord, Status>(
    (teacher, value) => teacher.status === value,
  );

  protected readonly records = createRecordList<TeacherRecord>({
    source: this.teacherService.teachers,
    searchKeys: [
      (teacher) => teacher.firstName,
      (teacher) => teacher.lastName,
      (teacher) => `${teacher.firstName} ${teacher.lastName}`,
      (teacher) => teacher.teacherDetails?.employeeNumber,
      (teacher) => teacher.department,
      (teacher) => teacher.subjects.join(' '),
      (teacher) => teacher.email,
      (teacher) => teacher.phone,
    ],
    sortKeys: {
      // Surname first: a staff list ordered by given name is not one anyone reads.
      name: (teacher) => `${teacher.lastName} ${teacher.firstName}`,
      employeeNumber: (teacher) => teacher.teacherDetails?.employeeNumber ?? '',
      department: (teacher) => teacher.department,
      status: (teacher) => teacher.status,
    },
    defaultSortField: 'name',
    filters: [this.departmentFilter, this.statusFilter] as never[],
    noun: { one: 'teacher', many: 'teachers' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** Built from the loaded staff, so the dropdown always matches the data. */
  protected readonly departmentOptions = computed(() =>
    Array.from(new Set(this.teacherService.teachers().map((teacher) => teacher.department)))
      .sort((a, b) => a.localeCompare(b))
      .map((department) => ({ label: department, value: department })),
  );

  protected fullName(teacher: TeacherRecord): string {
    return `${teacher.firstName} ${teacher.lastName}`;
  }

  protected initials(teacher: TeacherRecord): string {
    return `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  }
}
