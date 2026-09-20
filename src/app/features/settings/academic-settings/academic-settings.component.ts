import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SettingsSectionComponent } from '../../../share/components';

/**
 * 63-academic-settings.md — which academic concepts this school uses, what it
 * calls them, and how its year and grading are shaped.
 */
@Component({
  selector: 'app-academic-settings',
  imports: [
    FormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    SettingsSectionComponent,
  ],
  templateUrl: './academic-settings.component.html',
  styleUrl: './academic-settings.component.scss',
})
export class AcademicSettingsComponent {
  /**
   * 20-academic.md: "Do not assume every school needs every concept." Each
   * switch removes its concept from the menus, forms and reports rather than
   * leaving an empty screen behind.
   */
  protected readonly usePrograms = signal(false);
  protected readonly useLevels = signal(true);
  protected readonly useClasses = signal(true);
  protected readonly useSections = signal(true);
  protected readonly useSubjects = signal(true);
  protected readonly useTerms = signal(true);
  protected readonly useRooms = signal(true);

  protected readonly levelLabel = signal('Grade');
  protected readonly classLabel = signal('Class');
  protected readonly subjectLabel = signal('Subject');
  protected readonly studentLabel = signal('Student');
  protected readonly teacherLabel = signal('Teacher');

  protected readonly activeYear = signal('2024-2025');
  protected readonly autoRollover = signal(false);
  protected readonly termStructure = signal('semesters');

  protected readonly gradingScale = signal('percentage');
  protected readonly passMark = signal(50);

  protected readonly yearOptions = [
    { label: '2023 – 2024 (completed)', value: '2023-2024' },
    { label: '2024 – 2025 (active)', value: '2024-2025' },
    { label: '2025 – 2026 (upcoming)', value: '2025-2026' },
  ];

  protected readonly termStructureOptions = [
    { label: 'None — one continuous year', value: 'none' },
    { label: 'Semesters — two per year', value: 'semesters' },
    { label: 'Terms — three per year', value: 'terms' },
    { label: 'Quarters — four per year', value: 'quarters' },
  ];

  protected readonly gradingScaleOptions = [
    { label: 'Percentage (0 – 100)', value: 'percentage' },
    { label: 'Letter (A – F)', value: 'letter' },
    { label: 'GPA (4.0)', value: 'gpa' },
    { label: 'Pass / Fail', value: 'pass_fail' },
  ];
}
