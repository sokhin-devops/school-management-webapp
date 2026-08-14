import { Component, Input } from '@angular/core';
import { KShareModule } from '../../../../share/k-share.module';
import { Status } from '../../../../core/models';
import { StudentRecord } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-card',
  imports: [KShareModule],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.scss',
})
export class StudentCardComponent {
  @Input({ required: true }) student!: StudentRecord;

  protected get initials(): string {
    return `${this.student.firstName.charAt(0)}${this.student.lastName.charAt(0)}`.toUpperCase();
  }

  protected statusSeverity(status: Status): 'success' | 'danger' {
    return status === Status.Active ? 'success' : 'danger';
  }
}
