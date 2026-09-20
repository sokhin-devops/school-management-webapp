import { Component, input, output } from '@angular/core';
import { RowActionsComponent, StatusTagComponent } from '../../../../share/components';
import { Program } from '../../../../core/models';

/**
 * Grid-view card for a program. Reference data has no avatar and no identity, so
 * it gets its own card rather than the People kit's `k-person-card`.
 */
@Component({
  selector: 'app-program-card',
  imports: [RowActionsComponent, StatusTagComponent],
  templateUrl: './program-card.component.html',
  styleUrl: './program-card.component.scss',
})
export class ProgramCardComponent {
  readonly program = input.required<Program>();

  readonly view = output<Program>();
  readonly edit = output<Program>();
  readonly remove = output<Program>();
}
