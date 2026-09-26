import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { Observable, concat, defer, last, of } from 'rxjs';
import { SettingsSectionComponent } from '../../../share/components';
import {
  AcademicSettings,
  AcademicSettingsService,
  GradingScale,
  TermStructure,
} from '../../../core/services/academic-settings.service';
import { AcademicYearService } from '../../../core/services/academic-year.service';
import { AcademicYear, AcademicYearStatus } from '../../../core/models';
import { describeFailure } from '../../../core/api/api-failure';
import { CanDirective } from '../../../share/directives/can.directive';

/**
 * 63-academic-settings.md — which academic concepts this school uses, what it
 * calls them, and how its year and grading are shaped.
 */
@Component({
  selector: 'app-academic-settings',
  imports: [
    CanDirective,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    ToggleSwitchModule,
    SettingsSectionComponent,
  ],
  templateUrl: './academic-settings.component.html',
  styleUrl: './academic-settings.component.scss',
})
export class AcademicSettingsComponent {
  private readonly service = inject(AcademicSettingsService);
  private readonly yearService = inject(AcademicYearService);
  private readonly messages = inject(MessageService);

  /**
   * 20-academic.md: "Do not assume every school needs every concept." Each
   * switch removes its page from the menu and its route. Classes cannot be
   * switched off - attendance, assessments and enrolment all hang off them.
   */
  protected readonly usePrograms = signal(true);
  protected readonly useLevels = signal(true);
  protected readonly useSections = signal(true);
  protected readonly useSubjects = signal(true);
  protected readonly useTerms = signal(true);
  protected readonly useRooms = signal(true);

  protected readonly levelLabel = signal('Level');
  protected readonly classLabel = signal('Class');
  protected readonly subjectLabel = signal('Subject');
  protected readonly studentLabel = signal('Student');
  protected readonly teacherLabel = signal('Teacher');

  protected readonly activeYearId = signal<string | null>(null);
  protected readonly autoRollover = signal(false);
  protected readonly termStructure = signal<TermStructure>('SEMESTERS');
  protected readonly gradingScale = signal<GradingScale>('PERCENTAGE');
  protected readonly passMark = signal(50);

  protected readonly loaded = this.service.loaded;
  protected readonly saving = signal(false);

  /** The school's real years, the current one marked - not a list typed into the screen. */
  protected readonly yearOptions = computed(() =>
    this.yearService.years().map((year) => ({
      label: `${year.name}${year.status === AcademicYearStatus.Active ? ' (current)' : year.status === AcademicYearStatus.Completed ? ' (completed)' : ' (upcoming)'}`,
      value: year.id,
    })),
  );

  private readonly currentYear = computed<AcademicYear | null>(
    () => this.yearService.years().find((year) => year.status === AcademicYearStatus.Active) ?? null,
  );

  protected readonly termStructureOptions: { label: string; value: TermStructure }[] = [
    { label: 'None — one continuous year', value: 'NONE' },
    { label: 'Semesters — two per year', value: 'SEMESTERS' },
    { label: 'Terms — three per year', value: 'TERMS' },
    { label: 'Quarters — four per year', value: 'QUARTERS' },
  ];

  protected readonly gradingScaleOptions: { label: string; value: GradingScale }[] = [
    { label: 'Percentage (0 – 100)', value: 'PERCENTAGE' },
    { label: 'Letter (A – F)', value: 'LETTER' },
    { label: 'GPA (4.0)', value: 'GPA' },
    { label: 'Pass / Fail', value: 'PASS_FAIL' },
  ];

  constructor() {
    this.service.ensureLoaded().subscribe();

    // The draft follows the server until someone starts editing, and again
    // after every save or cancel.
    effect(() => {
      const settings = this.service.settings();
      untracked(() => this.apply(settings));
    });
    effect(() => {
      const current = this.currentYear();
      untracked(() => this.activeYearId.set(current?.id ?? null));
    });
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);

    // Settings first, then the year: if the year change is refused the rest has
    // still been kept, and the message says which part failed.
    const settings$ = this.service.save(this.draft());
    const year$ = this.yearChange();
    concat(settings$, year$)
      .pipe(last(undefined, null))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: 'Academic settings saved', life: 3000 });
        },
        error: (failure: unknown) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary: 'Could not save academic settings',
            detail: describeFailure(failure),
            life: 6000,
          });
        },
      });
  }

  /** Puts every field back to what the server holds. */
  protected cancel(): void {
    this.apply(this.service.settings());
    this.activeYearId.set(this.currentYear()?.id ?? null);
  }

  private yearChange(): Observable<unknown> {
    const chosen = this.yearService.years().find((year) => year.id === this.activeYearId());
    if (!chosen || chosen.status === AcademicYearStatus.Active) {
      return of(null);
    }
    // Marking a year current is what makes it the active one; the server moves
    // the flag off the old year in the same step.
    return defer(() => this.yearService.save({ ...chosen, status: AcademicYearStatus.Active }));
  }

  private draft(): AcademicSettings {
    return {
      usePrograms: this.usePrograms(),
      useLevels: this.useLevels(),
      useSections: this.useSections(),
      useSubjects: this.useSubjects(),
      useTerms: this.useTerms(),
      useRooms: this.useRooms(),
      levelLabel: this.levelLabel().trim() || 'Level',
      classLabel: this.classLabel().trim() || 'Class',
      subjectLabel: this.subjectLabel().trim() || 'Subject',
      studentLabel: this.studentLabel().trim() || 'Student',
      teacherLabel: this.teacherLabel().trim() || 'Teacher',
      autoRollover: this.autoRollover(),
      termStructure: this.termStructure(),
      gradingScale: this.gradingScale(),
      passMark: Math.min(100, Math.max(1, Math.round(this.passMark() ?? 50))),
    };
  }

  private apply(settings: AcademicSettings): void {
    this.usePrograms.set(settings.usePrograms);
    this.useLevels.set(settings.useLevels);
    this.useSections.set(settings.useSections);
    this.useSubjects.set(settings.useSubjects);
    this.useTerms.set(settings.useTerms);
    this.useRooms.set(settings.useRooms);
    this.levelLabel.set(settings.levelLabel);
    this.classLabel.set(settings.classLabel);
    this.subjectLabel.set(settings.subjectLabel);
    this.studentLabel.set(settings.studentLabel);
    this.teacherLabel.set(settings.teacherLabel);
    this.autoRollover.set(settings.autoRollover);
    this.termStructure.set(settings.termStructure);
    this.gradingScale.set(settings.gradingScale);
    this.passMark.set(settings.passMark);
  }
}
