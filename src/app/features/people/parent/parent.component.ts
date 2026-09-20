import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { DataViewModule } from 'primeng/dataview';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from 'primeng/api';
import {
  EmptyStateComponent,
  ListShellComponent,
  ListToolbarComponent,
  RowActionsComponent,
  StatusTagComponent,
} from '../../../share/components';
import { RecordFilter, createRecordList } from '../../../share/data/record-list';
import { LayoutUiService } from '../../../core/services/layout-ui.service';
import { ParentRecord, ParentService } from '../../../core/services/parent.service';
import { Status } from '../../../core/models';
import { ParentCardComponent } from './parent-card/parent-card.component';

@Component({
  selector: 'app-parent',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    AvatarModule,
    DataViewModule,
    TableModule,
    PaginatorModule,
    SharedModule,
    ListShellComponent,
    ListToolbarComponent,
    EmptyStateComponent,
    RowActionsComponent,
    StatusTagComponent,
    ParentCardComponent,
  ],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
})
export class ParentComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  private readonly parentService = inject(ParentService);

  protected readonly relationshipFilter = new RecordFilter<ParentRecord, string>(
    (parent, value) => parent.relationship === value,
  );

  protected readonly statusFilter = new RecordFilter<ParentRecord, Status>(
    (parent, value) => parent.status === value,
  );

  protected readonly records = createRecordList<ParentRecord>({
    source: this.parentService.parents,
    searchKeys: [
      (parent) => parent.firstName,
      (parent) => parent.lastName,
      (parent) => `${parent.firstName} ${parent.lastName}`,
      (parent) => parent.relationship,
      (parent) => parent.children.join(' '),
      (parent) => parent.email,
      (parent) => parent.phone,
    ],
    sortKeys: {
      name: (parent) => `${parent.lastName} ${parent.firstName}`,
      relationship: (parent) => parent.relationship,
      children: (parent) => parent.children.length,
      status: (parent) => parent.status,
    },
    defaultSortField: 'name',
    filters: [this.relationshipFilter, this.statusFilter] as never[],
    noun: { one: 'parent', many: 'parents' },
  });

  protected readonly statusOptions = [
    { label: 'Active', value: Status.Active },
    { label: 'Inactive', value: Status.Inactive },
  ];

  protected readonly relationshipOptions = computed(() =>
    Array.from(new Set(this.parentService.parents().map((parent) => parent.relationship)))
      .sort((a, b) => a.localeCompare(b))
      .map((relationship) => ({ label: relationship, value: relationship })),
  );

  protected fullName(parent: ParentRecord): string {
    return `${parent.firstName} ${parent.lastName}`;
  }

  protected initials(parent: ParentRecord): string {
    return `${parent.firstName.charAt(0)}${parent.lastName.charAt(0)}`.toUpperCase();
  }
}
