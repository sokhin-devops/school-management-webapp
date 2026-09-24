import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../share/components';
import { FormValidationService } from '../../../share/forms';
import { AssessmentRecord, AssessmentType } from '../../../core/services/assessment.service';
import { isoDate } from '../../../share/data/format';

/** Create / edit an assessment. */
@Component({
  selector: 'app-assessment-form',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './assessment-form.component.html',
  host: { class: 'k-form-host' },
})
export class AssessmentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly assessment = input<AssessmentRecord | null>(null);
  readonly subjectOptions = input<readonly { label: string; value: string }[]>([]);
  readonly classOptions = input<readonly { label: string; value: string }[]>([]);

  readonly saved = output<AssessmentRecord>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    subjectId: ['', Validators.required],
    classGroupId: ['', Validators.required],
    type: ['Quiz' as AssessmentType, Validators.required],
    date: [null as Date | null, Validators.required],
    maxScore: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
  });

  protected readonly typeOptions: { label: string; value: AssessmentType }[] = [
    { label: 'Quiz', value: 'Quiz' },
    { label: 'Midterm', value: 'Midterm' },
    { label: 'Final', value: 'Final' },
    { label: 'Assignment', value: 'Assignment' },
  ];

  protected readonly subjectChoices = computed(() => [...this.subjectOptions()]);
  protected readonly classChoices = computed(() => [...this.classOptions()]);

  protected readonly isEdit = computed(() => this.assessment() !== null);
  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    subjectId: 'Subject',
    classGroupId: 'Class',
    type: 'Type',
    date: 'Date',
    maxScore: 'Maximum score',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.assessment();
      untracked(() => this.reset(record));
    });
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
    this.visible.set(false);
  }

  private reset(record: AssessmentRecord | null): void {
    this.form.reset({
      name: record?.name ?? '',
      subjectId: record?.subjectId ?? '',
      classGroupId: record?.classGroupId ?? '',
      type: record?.type ?? 'Quiz',
      date: record?.date ? new Date(record.date) : new Date(),
      maxScore: record?.maxScore ?? 100,
    });
  }

  private toRecord(): AssessmentRecord {
    const value = this.form.getRawValue();
    const existing = this.assessment();

    return {
      ...existing,
      id: existing?.id ?? '',
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      name: value.name.trim(),
      subjectId: value.subjectId,
      classGroupId: value.classGroupId,
      // Names are for the screen; the record is keyed by id.
      subject: '',
      className: '',
      type: value.type,
      date: isoDate(value.date),
      maxScore: value.maxScore,
      // Both of these come from marking, not from setting the paper.
      averageScore: existing?.averageScore ?? 0,
      graded: existing?.graded ?? false,
    };
  }
}
