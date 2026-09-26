import { Component, computed, effect, inject, input, model, output, untracked } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormDialogComponent, FormFieldComponent } from '../../../../share/components';
import { FormValidationService } from '../../../../share/forms';
import { BranchContextService } from '../../../../core/services/branch-context.service';
import { AcademicSettingsService, TermStructure } from '../../../../core/services/academic-settings.service';
import { AcademicYear, AcademicYearStatus, Term } from '../../../../core/models';
import { isoDate } from '../../../../share/data/format';

/** How many parts each structure divides a year into, and what each part is called. */
const STRUCTURES: Readonly<Record<Exclude<TermStructure, 'NONE'>, { count: number; name: string }>> = {
  SEMESTERS: { count: 2, name: 'Semester' },
  TERMS: { count: 3, name: 'Term' },
  QUARTERS: { count: 4, name: 'Quarter' },
};

/**
 * Create / edit an academic year - 25-academic-years.md, including the
 * semesters or terms a school divides it into, when it uses them.
 */
@Component({
  selector: 'app-academic-year-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    FormDialogComponent,
    FormFieldComponent,
  ],
  templateUrl: './academic-year-form.component.html',
  host: { class: 'k-form-host' },
})
export class AcademicYearFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly validation = inject(FormValidationService);
  private readonly branchContext = inject(BranchContextService);
  protected readonly academic = inject(AcademicSettingsService);

  readonly visible = model<boolean>(false);
  /** The record being edited, or null to create a new one. */
  readonly year = input<AcademicYear | null>(null);

  readonly saved = output<AcademicYear>();

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(20)]],
    status: [AcademicYearStatus.Upcoming, Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, [Validators.required, (control: AbstractControl) => this.afterStart(control)]],
    terms: this.formBuilder.array<ReturnType<AcademicYearFormComponent['termGroup']>>([]),
  });

  protected readonly statusOptions = [
    { label: 'Upcoming', value: AcademicYearStatus.Upcoming },
    { label: 'Active', value: AcademicYearStatus.Active },
    { label: 'Completed', value: AcademicYearStatus.Completed },
  ];

  protected readonly isEdit = computed(() => this.year() !== null);

  /** "Fill in 2 semesters" - offered only when the school has a structure to fill from. */
  protected readonly fillLabel = computed(() => {
    const structure = this.academic.settings().termStructure;
    if (structure === 'NONE') {
      return null;
    }
    const { count, name } = STRUCTURES[structure];
    return `Fill in ${count} ${name.toLowerCase()}s`;
  });

  /** One source for the field names, shared by the labels and the alert. */
  protected readonly labels = {
    name: 'Name',
    status: 'Status',
    startDate: 'Start date',
    endDate: 'End date',
    terms: 'Terms',
  } as const;

  constructor() {
    // Opening is what resets the draft, not closing: a dialog that clears on the
    // way out flashes empty fields through the hide animation.
    effect(() => {
      if (!this.visible()) {
        return;
      }
      const record = this.year();
      untracked(() => this.reset(record));
    });
  }

  protected get terms(): FormArray {
    return this.form.controls.terms;
  }

  protected addTerm(): void {
    const previous = this.terms.at(this.terms.length - 1)?.value as { endDate: Date | null } | undefined;
    const start = previous?.endDate ? addDays(previous.endDate, 1) : this.form.controls.startDate.value;
    this.terms.push(this.termGroup({ name: `Term ${this.terms.length + 1}`, startDate: start, endDate: null }));
  }

  protected removeTerm(index: number): void {
    this.terms.removeAt(index);
  }

  /**
   * Splits the year into equal parts by the school's term structure. Dates
   * are a starting point to adjust, not a rule: holidays fall where they fall.
   */
  protected fillFromStructure(): void {
    const structure = this.academic.settings().termStructure;
    const start = this.form.controls.startDate.value;
    const end = this.form.controls.endDate.value;
    if (structure === 'NONE' || !start || !end || end <= start) {
      this.form.controls.startDate.markAsTouched();
      this.form.controls.endDate.markAsTouched();
      return;
    }

    const { count, name } = STRUCTURES[structure];
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const length = Math.floor(days / count);

    this.terms.clear();
    for (let i = 0; i < count; i++) {
      const termStart = addDays(start, i * length);
      const termEnd = i === count - 1 ? end : addDays(start, (i + 1) * length - 1);
      this.terms.push(this.termGroup({ name: `${name} ${i + 1}`, startDate: termStart, endDate: termEnd }));
    }
  }

  protected onSave(): void {
    if (!this.validation.check(this.form, this.labels)) {
      return;
    }

    this.saved.emit(this.toRecord());
  }

  private termGroup(term: { name: string; startDate: Date | null; endDate: Date | null }) {
    return this.formBuilder.nonNullable.group({
      name: [term.name, [Validators.required, Validators.maxLength(60)]],
      startDate: [term.startDate, Validators.required],
      endDate: [term.endDate, Validators.required],
    });
  }

  private reset(record: AcademicYear | null): void {
    this.terms.clear();
    for (const term of record?.terms ?? []) {
      this.terms.push(this.termGroup({ name: term.name, startDate: parseDate(term.startDate), endDate: parseDate(term.endDate) }));
    }
    this.form.reset({
      name: record?.name ?? '',
      status: record?.status ?? AcademicYearStatus.Upcoming,
      startDate: parseDate(record?.startDate),
      endDate: parseDate(record?.endDate),
      terms: this.terms.getRawValue(),
    });
  }

  private toRecord(): AcademicYear {
    const value = this.form.getRawValue();
    const existing = this.year();
    const selected = this.branchContext.selectedBranch();
    const useTerms = this.academic.settings().useTerms;

    const terms: Term[] = useTerms
      ? value.terms.map((term, index) => ({
          id: `${existing?.id ?? 'new'}-${index}`,
          name: term.name.trim(),
          startDate: isoDate(term.startDate),
          endDate: isoDate(term.endDate),
        }))
      : // Switched off, the year keeps whatever terms it had rather than
        // losing them to a form that could not show them.
        (existing?.terms ?? []);

    return {
      ...existing,
      // Empty on create: the server assigns the id, and inventing one here
      // made every create look like an update of a record that never existed.
      id: existing?.id ?? '',
      branchId: existing?.branchId ?? selected?.id ?? '',
      schoolId: existing?.schoolId ?? selected?.schoolId,
      name: value.name.trim(),
      startDate: isoDate(value.startDate),
      endDate: isoDate(value.endDate),
      status: value.status,
      terms,
    };
  }

  /** A year that ends before it starts would break every date range built from it. */
  private afterStart(control: AbstractControl): ValidationErrors | null {
    const start = this.form?.controls.startDate.value;
    const end = control.value as Date | null;
    if (!start || !end) {
      return null;
    }
    return end > start ? null : { message: 'End date must come after the start date.' };
  }
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** An ISO date as a local date - `new Date('2026-09-01')` would be UTC midnight, the day before in the west. */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}
