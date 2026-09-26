import { Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RowActionsComponent, StatusTagComponent } from '../../../share/components';
import { AssessmentRecord } from '../../../core/services/assessment.service';
import { AcademicSettingsService } from '../../../core/services/academic-settings.service';
import { formatResult } from '../../../share/data/format';

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

  private readonly academicSettings = inject(AcademicSettingsService);

  /** The raw average, then the same in the school's grading scale. */
  protected readonly averageLabel = computed(() => {
    const { averageScore, maxScore } = this.assessment();
    const settings = this.academicSettings.settings();
    const result = formatResult(maxScore ? (averageScore / maxScore) * 100 : 0, settings.gradingScale, settings.passMark);
    return `${averageScore} / ${maxScore} · ${result}`;
  });
}
