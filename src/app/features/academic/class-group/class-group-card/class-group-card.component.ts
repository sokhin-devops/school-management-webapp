import { Component, computed, input, output } from '@angular/core';
import { RowActionsComponent, StatusTagComponent } from '../../../../share/components';
import { ClassGroupRecord } from '../../../../core/services/class-group.service';
import { CapacityBarComponent } from '../capacity-bar/capacity-bar.component';

/** One labelled line in the card body. */
interface ClassFact {
  readonly label: string;
  readonly text: string;
}

/** Grid-view card for a class; the shared kit's only card is person-shaped. */
@Component({
  selector: 'app-class-group-card',
  imports: [RowActionsComponent, StatusTagComponent, CapacityBarComponent],
  templateUrl: './class-group-card.component.html',
  styleUrl: './class-group-card.component.scss',
})
export class ClassGroupCardComponent {
  readonly classGroup = input.required<ClassGroupRecord>();

  readonly view = output<ClassGroupRecord>();
  readonly edit = output<ClassGroupRecord>();
  readonly remove = output<ClassGroupRecord>();

  protected readonly facts = computed<ClassFact[]>(() => {
    const group = this.classGroup();

    return [
      { label: 'Level', text: group.levelName },
      { label: 'Program', text: group.programName },
      { label: 'Academic year', text: group.academicYearName },
    ].filter((fact) => !!fact.text);
  });
}
