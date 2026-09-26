import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { AuthCardComponent } from '../../../share/components/auth-card/auth-card.component';
import { AcademicYearStatus, SchoolType } from '../../../core/models';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { KShareModule } from '../../../share/k-share.module';
import { isoDate } from '../../../share/data/format';

@Component({
  selector: 'app-school-setup',
  imports: [ReactiveFormsModule, AuthCardComponent, KShareModule],
  templateUrl: './school-setup.component.html',
  styleUrl: './school-setup.component.scss',
})
export class SchoolSetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly onboarding = inject(OnboardingService);

  readonly schoolTypeOptions = [
    { label: 'Primary School', value: SchoolType.PrimarySchool },
    { label: 'Secondary School', value: SchoolType.SecondarySchool },
    { label: 'High School', value: SchoolType.HighSchool },
    { label: 'College', value: SchoolType.College },
    { label: 'University', value: SchoolType.University },
    { label: 'Language Center', value: SchoolType.LanguageCenter },
    { label: 'Training Center', value: SchoolType.TrainingCenter },
    { label: 'Vocational School', value: SchoolType.VocationalSchool },
    { label: 'Other', value: SchoolType.Other },
  ];

  readonly schoolForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: [SchoolType.PrimarySchool, Validators.required],
    // Required by the API, and by 61-school-settings.md, which asks for an
    // identity, a contact and an address.
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
  });

  readonly branchForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: [''],
  });

  readonly academicForm = this.fb.group({
    name: this.fb.nonNullable.control('', Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    endDate: this.fb.control<Date | null>(null, Validators.required),
  });

  schoolSubmitted = false;
  branchSubmitted = false;
  academicSubmitted = false;

  goToBranch(activateCallback: (index: number) => void): void {
    this.schoolSubmitted = true;
    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      return;
    }
    // Saved as the step is completed rather than at Done: a wizard that keeps
    // everything in memory loses the lot if the tab is closed half way, and the
    // branch below needs a school on the server to hang off.
    const school = this.schoolForm.getRawValue();
    this.onboarding.setSchool(school);
    this.onboarding
      .createSchool({
        name: school.name,
        type: toApiSchoolType(school.type),
        email: school.email,
        phone: school.phone,
        address: school.address,
      })
      .subscribe({ next: () => activateCallback(2), error: stayOnStep });
  }

  goToAcademic(activateCallback: (index: number) => void): void {
    this.branchSubmitted = true;
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const branch = this.branchForm.getRawValue();
    this.onboarding.setBranch(branch);
    this.onboarding
      .createBranch({ name: branch.name, address: branch.address, phone: branch.phone })
      .subscribe({ next: () => activateCallback(3), error: stayOnStep });
  }

  finish(): void {
    this.academicSubmitted = true;
    if (this.academicForm.invalid) {
      this.academicForm.markAllAsTouched();
      return;
    }
    const { name, startDate, endDate } = this.academicForm.getRawValue();
    this.onboarding.setAcademicYear({
      name,
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      status: AcademicYearStatus.Upcoming,
    });

    // Only once the server has it: landing on a dashboard whose data never
    // saved is worse than staying on the step that failed.
    this.onboarding
      .createAcademicYear({ name, startDate: isoDate(startDate), endDate: isoDate(endDate) })
      .subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: stayOnStep });
  }
}

/** The refusal is already on screen, from onboarding.error(); the step stays open to fix it. */
function stayOnStep(): void {}

/**
 * The screens spell school types in lower snake case and the API in upper.
 * The two lists hold the same nine values, so this is a case change rather than
 * a mapping table that could fall out of step.
 */
function toApiSchoolType(type: SchoolType): string {
  return type.toUpperCase();
}
