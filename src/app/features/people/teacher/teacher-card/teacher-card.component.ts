import { Component, computed, input, output } from '@angular/core';
import { PersonCardComponent, RowActionsComponent, type PersonCardMeta } from '../../../../share/components';
import { TeacherRecord } from '../../../../core/services/teacher.service';

/** Grid-view card for a teacher; the look comes from the shared `k-person-card`. */
@Component({
  selector: 'app-teacher-card',
  imports: [PersonCardComponent, RowActionsComponent],
  templateUrl: './teacher-card.component.html',
  styleUrl: './teacher-card.component.scss',
})
export class TeacherCardComponent {
  readonly teacher = input.required<TeacherRecord>();

  readonly view = output<TeacherRecord>();
  readonly edit = output<TeacherRecord>();
  readonly remove = output<TeacherRecord>();

  protected readonly fullName = computed(() => `${this.teacher().firstName} ${this.teacher().lastName}`);

  protected readonly meta = computed<PersonCardMeta[]>(() => {
    const teacher = this.teacher();

    return [
      { icon: 'pi-briefcase', label: 'Department', text: teacher.department },
      { icon: 'pi-book', label: 'Subjects', text: teacher.subjects.join(', ') },
      { icon: 'pi-envelope', label: 'Email', text: teacher.email ?? '' },
      { icon: 'pi-phone', label: 'Phone', text: teacher.phone ?? '' },
    ].filter((row) => !!row.text);
  });
}
