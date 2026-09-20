import { Component, computed, input, output } from '@angular/core';
import { PersonCardComponent, RowActionsComponent, type PersonCardMeta } from '../../../../share/components';
import { ParentRecord } from '../../../../core/services/parent.service';

/** Grid-view card for a parent/guardian; the look comes from the shared `k-person-card`. */
@Component({
  selector: 'app-parent-card',
  imports: [PersonCardComponent, RowActionsComponent],
  templateUrl: './parent-card.component.html',
  styleUrl: './parent-card.component.scss',
})
export class ParentCardComponent {
  readonly parent = input.required<ParentRecord>();

  readonly view = output<ParentRecord>();
  readonly edit = output<ParentRecord>();
  readonly remove = output<ParentRecord>();

  protected readonly fullName = computed(() => `${this.parent().firstName} ${this.parent().lastName}`);

  protected readonly meta = computed<PersonCardMeta[]>(() => {
    const parent = this.parent();

    return [
      { icon: 'pi-graduation-cap', label: 'Children', text: parent.children.join(', ') },
      { icon: 'pi-envelope', label: 'Email', text: parent.email ?? '' },
      { icon: 'pi-phone', label: 'Phone', text: parent.phone ?? '' },
    ].filter((row) => !!row.text);
  });
}
