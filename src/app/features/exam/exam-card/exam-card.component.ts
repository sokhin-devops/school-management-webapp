import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RowActionsComponent, StatusTagComponent } from '../../../share/components';
import { AssessmentRecord } from '../../../core/services/assessment.service';

/**
 * Grid-view card for an assessment. `k-person-card` is the kit's only card and
 * it is built around a person — name, initials, avatar — so an assessment gets
 * its own, assembled from the shared `k-card` and `k-facts` classes.
 */
@Component({
  selector: 'app-exam-card',
  imports: [DatePipe, CardModule, TagModule, RowActionsComponent, StatusTagComponent],
  templateUrl: './exam-card.component.html',
  styleUrl: './exam-card.component.scss',
})
export class ExamCardComponent {
  readonly assessment = input.required<AssessmentRecord>();

  readonly view = output<AssessmentRecord>();
  readonly edit = output<AssessmentRecord>();
  readonly remove = output<AssessmentRecord>();

  protected readonly averageLabel = computed(
    () => `${this.assessment().averageScore} / ${this.assessment().maxScore}`,
  );
}
