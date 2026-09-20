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
import { StudentRecord, StudentService } from '../../../core/services/student.service';
import { Status } from '../../../core/models';
import { StudentCardComponent } from './student-card/student-card.component';

@Component({
  selector: 'app-student',
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
    StudentCardComponent,
  ],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss',
})
export class StudentComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly studentService = inject(StudentService);

  protected readonly classFilter = new RecordFilter<StudentRecord, string>(
    (student, value) => student.className === value,
  );

  protected readonly statusFilter = new RecordFilter<StudentRecord, Status>(
    (student, value) => student.status === value,
  );

  protected readonly records = createRecordList<StudentRecord>({
    source: this.studentService.students,
    searchKeys: [
      (student) => student.firstName,
      (student) => student.lastName,
      (student) => `${student.firstName} ${student.lastName}`,
      (student) => student.studentDetails?.admissionNumber,
      (student) => student.className,
      (student) => student.email,
      (student) => student.phone,
    ],
    sortKeys: {
      // Surname first: a roster sorted by given name is not one anyone reads.
      name: (student) => `${student.lastName} ${student.firstName}`,
      admissionNumber: (student) => student.studentDetails?.admissionNumber ?? '',
      className: (student) => student.className,
      status: (student) => student.status,
    },
    defaultSortField: 'name',
    filters: [this.classFilter, this.statusFilter] as never[],
    noun: { one: 'student', many: 'students' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** Built from the loaded students, so the dropdown always matches the data. */
  protected readonly classOptions = computed(() =>
    Array.from(new Set(this.studentService.students().map((student) => student.className)))
      .sort((a, b) => a.localeCompare(b))
      .map((className) => ({ label: className, value: className })),
  );

  protected fullName(student: StudentRecord): string {
    return `${student.firstName} ${student.lastName}`;
  }

  protected initials(student: StudentRecord): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  }
}
