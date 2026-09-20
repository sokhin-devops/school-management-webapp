import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { Status } from '../../../core/models';
import { StatusTagComponent } from '../status-tag/status-tag.component';

/** One labelled line in a card's body, e.g. a class, an email, a phone number. */
export interface PersonCardMeta {
  /** A PrimeIcons name, e.g. `pi-envelope`. */
  readonly icon: string;
  readonly text: string;
  /** Read out in place of the icon, which is decorative. */
  readonly label: string;
}

/**
 * The grid-view card for anyone in People — 11-people.md puts students, teachers
 * and parents on one Person model, so they get one card. The caller supplies the
 * meta lines, which is the only part that differs between them, and projects the
 * footer actions so the card itself stays presentational.
 */
@Component({
  selector: 'k-person-card',
  imports: [NgClass, AvatarModule, StatusTagComponent],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent {
  readonly name = input.required<string>();
  /** The identifier under the name — an admission or employee number. */
  readonly subtitle = input<string>('');
  readonly status = input<Status>();
  readonly meta = input<readonly PersonCardMeta[]>([]);

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );
}
