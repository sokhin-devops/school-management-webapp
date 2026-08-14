import { Component, computed, inject, signal } from '@angular/core';
import { KShareModule } from '../../../share/k-share.module';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { StudentRecord, StudentService } from '../../../core/services/student.service';
import { Status } from '../../../core/models';
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

  protected initials(student: StudentRecord): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  }

  protected statusSeverity(status: Status): 'success' | 'danger' {
    return status === Status.Active ? 'success' : 'danger';
  }
}
