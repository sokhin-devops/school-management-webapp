import { Component, computed, inject, signal } from '@angular/core';
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
import { ParentFormComponent } from './parent-form/parent-form.component';
import { openOnQuickAdd } from '../../../core/services/quick-add.service';
import { describeFailure } from '../../../core/api/api-failure';
import { StudentService } from '../../../core/services/student.service';

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
    ParentFormComponent,
  ],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
})
export class ParentComponent {
  protected readonly layoutUi = inject(LayoutUiService);
  protected readonly parentService = inject(ParentService);
  private readonly studentService = inject(StudentService);

  protected readonly relationshipFilter = new RecordFilter<ParentRecord, string>(
    (parent, value) => parent.relationship === value,
  );

  protected readonly statusFilter = new RecordFilter<ParentRecord, Status>(
    (parent, value) => parent.status === value,
  );

  /** The API stores studentIds; the card lists the children by name. */
  private readonly named = computed<ParentRecord[]>(() => {
    const students = new Map(
      this.studentService.students().map((student) => [student.id, `${student.firstName} ${student.lastName}`]),
    );
    return this.parentService.parents().map((parent) => ({
      ...parent,
      children: (parent.parentDetails?.studentPersonIds ?? [])
        .map((id) => students.get(id) ?? '')
        .filter((name) => name !== ''),
    }));
  });

  protected readonly records = createRecordList<ParentRecord>({
    source: this.named,
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
  /** A save the server refused. Cleared the next time the form opens. */
  protected readonly saveError = signal<string | null>(null);

  protected readonly formVisible = signal(false);
  /** The record the dialog is editing; null opens it as a create form. */
  protected readonly editing = signal<ParentRecord | null>(null);

  constructor() {
    openOnQuickAdd('parent', () => this.openCreate());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formVisible.set(true);
  }

  protected openEdit(parent: ParentRecord): void {
    this.editing.set(parent);
    this.formVisible.set(true);
  }

  protected onSaved(parent: ParentRecord): void {
    // The list reloads from the server once the record is stored, so what is on
    // screen is what was actually saved rather than what was sent.
    this.parentService.save(parent).subscribe({
      error: (failure: unknown) => this.saveError.set(describeFailure(failure)),
    });
  }
}
