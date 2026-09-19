import { Component, computed, inject, signal } from '@angular/core';
import { KShareModule } from '../../../share/k-share.module';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { StudentRecord, StudentService } from '../../../core/services/student.service';
import { Status } from '../../../core/models';
import { PaginatorState } from 'primeng/paginator';
import { StudentCardComponent } from './student-card/student-card.component';

@Component({
  selector: 'app-student',
  imports: [KShareModule, StudentCardComponent],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss',
})
export class StudentComponent {
  // Services
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly studentService = inject(StudentService);
  
  // Variables
  protected readonly searchTerm = signal('');
  protected readonly selectedClass = signal<string | null>(null);
  protected readonly selectedStatus = signal<Status | null>(null);

  protected readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  /** Class list built from the loaded students so the dropdown always matches the data. */
  protected readonly classOptions = computed(() =>
    Array.from(new Set(this.studentService.students().map((student) => student.className)))
      .sort((a, b) => a.localeCompare(b))
      .map((className) => ({ label: className, value: className })),
  );

  protected readonly first = signal(0);
  protected readonly rows = signal(8);
  protected readonly rowsPerPageOptions = [8, 16, 24];

  protected readonly hasFilters = computed(
    () => !!this.searchTerm().trim() || this.selectedClass() !== null || this.selectedStatus() !== null,
  );

  protected readonly students = computed<StudentRecord[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.studentService.students();
    if (!term) {
      return all;
    }

    return all.filter((student) =>
      [student.firstName, student.lastName, student.studentDetails?.admissionNumber, student.className]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(term)),
    );
  });

  /** Page slice handed to the dataview, now that paging lives in the standalone p-paginator. */
  protected readonly pagedStudents = computed<StudentRecord[]>(() => {
    const start = this.first();
    return this.students().slice(start, start + this.rows());
  });

  protected onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  protected onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.first.set(0);
  }

  protected clearFilters(): void {
    this.first.set(0);
    this.searchTerm.set('');
    this.selectedClass.set(null);
    this.selectedStatus.set(null);
  }

  protected initials(student: StudentRecord): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  }

  protected statusSeverity(status: Status): 'success' | 'danger' {
    return status === Status.Active ? 'success' : 'danger';
  }
}
