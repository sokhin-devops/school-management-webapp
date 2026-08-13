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

@Component({
  selector: 'app-school-setup',
  imports: [ReactiveFormsModule, AuthCardComponent, KShareModule],
  templateUrl: './school-setup.component.html',
  styleUrl: './school-setup.component.scss',
})
export class SchoolSetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

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
  });

  readonly branchForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: [''],
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
    this.onboarding.setSchool(this.schoolForm.getRawValue());
    activateCallback(2);
  }

  goToAcademic(activateCallback: (index: number) => void): void {
    this.branchSubmitted = true;
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    this.onboarding.setBranch(this.branchForm.getRawValue());
    activateCallback(3);
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
      startDate: startDate!.toISOString(),
      endDate: endDate!.toISOString(),
      status: AcademicYearStatus.Upcoming,
    });
    this.router.navigateByUrl('/dashboard');
  }
}
