import { Component, computed, input, output } from '@angular/core';
import { PersonCardComponent, RowActionsComponent, type PersonCardMeta } from '../../../../share/components';
import { StudentRecord } from '../../../../core/services/student.service';

/**
 * The grid-view card for a student: everything student-shaped about it lives
 * here, and the look comes from the shared `k-person-card` that Teachers and
 * Parents use too.
 */
@Component({
  selector: 'app-student-card',
  imports: [PersonCardComponent, RowActionsComponent],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.scss',
})
export class StudentCardComponent {
  readonly student = input.required<StudentRecord>();

  readonly view = output<StudentRecord>();
  readonly edit = output<StudentRecord>();
  readonly remove = output<StudentRecord>();

  protected readonly fullName = computed(() => `${this.student().firstName} ${this.student().lastName}`);

  protected readonly meta = computed<PersonCardMeta[]>(() => {
    const student = this.student();

    return [
      { icon: 'pi-graduation-cap', label: 'Class', text: student.className },
      { icon: 'pi-envelope', label: 'Email', text: student.email ?? '' },
      { icon: 'pi-phone', label: 'Phone', text: student.phone ?? '' },
    ].filter((row) => !!row.text);
  });
}
