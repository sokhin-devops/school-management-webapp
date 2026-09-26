import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import { CanDirective } from '../../../share/directives/can.directive';
import { SchoolProfile, SchoolService } from '../../../core/services/school.service';
import { describeFailure } from '../../../core/api/api-failure';

/** The API's school types - the nine the onboarding wizard offers. */
const SCHOOL_TYPES: { label: string; value: string }[] = [
  { label: 'Primary school', value: 'PRIMARY_SCHOOL' },
  { label: 'Secondary school', value: 'SECONDARY_SCHOOL' },
  { label: 'High school', value: 'HIGH_SCHOOL' },
  { label: 'College', value: 'COLLEGE' },
  { label: 'University', value: 'UNIVERSITY' },
  { label: 'Language center', value: 'LANGUAGE_CENTER' },
  { label: 'Training center', value: 'TRAINING_CENTER' },
  { label: 'Vocational school', value: 'VOCATIONAL_SCHOOL' },
  { label: 'Other', value: 'OTHER' },
];

/** 61-school-settings.md — the school's own profile, contact details and currency. */
@Component({
  selector: 'app-school',
  imports: [
    CanDirective,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TextareaModule,
    SettingsSectionComponent,
  ],
  templateUrl: './school.component.html',
  styleUrl: './school.component.scss',
})
export class SchoolComponent {
  private readonly schoolService = inject(SchoolService);
  private readonly messages = inject(MessageService);

  protected readonly school = this.schoolService.school;
  protected readonly loadError = this.schoolService.error;

  protected readonly name = signal('');
  protected readonly shortName = signal('');
  protected readonly schoolType = signal('OTHER');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly website = signal('');
  protected readonly address = signal('');
  protected readonly currency = signal('USD');

  protected readonly saving = signal(false);

  /**
   * 00-product-overview.md: one platform serves every institution type, so the
   * type is part of the profile rather than a separate deployment.
   */
  protected readonly schoolTypeOptions = SCHOOL_TYPES;

  protected readonly currencyOptions = [
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'KHR — Cambodian Riel', value: 'KHR' },
    { label: 'THB — Thai Baht', value: 'THB' },
    { label: 'VND — Vietnamese Dong', value: 'VND' },
    { label: 'LAK — Lao Kip', value: 'LAK' },
    { label: 'MYR — Malaysian Ringgit', value: 'MYR' },
    { label: 'SGD — Singapore Dollar', value: 'SGD' },
    { label: 'IDR — Indonesian Rupiah', value: 'IDR' },
    { label: 'PHP — Philippine Peso', value: 'PHP' },
    { label: 'INR — Indian Rupee', value: 'INR' },
    { label: 'AUD — Australian Dollar', value: 'AUD' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'GBP — British Pound', value: 'GBP' },
  ];

  constructor() {
    this.schoolService.ensureLoaded();
    effect(() => {
      const school = this.school();
      if (school) {
        untracked(() => this.apply(school));
      }
    });
  }

  protected retry(): void {
    this.schoolService.reload();
  }

  /** Every section saves the whole profile: the API takes it as one record. */
  protected save(): void {
    const school = this.school();
    if (!school || this.saving()) {
      return;
    }
    const missing = [
      ['School name', this.name()],
      ['Email', this.email()],
      ['Phone', this.phone()],
      ['Address', this.address()],
    ].filter(([, value]) => !String(value).trim()).map(([label]) => label);
    if (missing.length) {
      this.messages.add({ severity: 'warn', summary: 'Some details are missing', detail: `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`, life: 5000 });
      return;
    }

    this.saving.set(true);
    this.schoolService
      .save(school.id, {
        name: this.name().trim(),
        type: this.schoolType(),
        email: this.email().trim(),
        phone: this.phone().trim(),
        address: this.address().trim(),
        shortName: this.shortName().trim() || null,
        website: this.website().trim() || null,
        currency: this.currency(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'success', summary: 'School profile saved', life: 3000 });
        },
        error: (failure: unknown) => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: 'Could not save', detail: describeFailure(failure), life: 6000 });
        },
      });
  }

  protected cancel(): void {
    const school = this.school();
    if (school) {
      this.apply(school);
    }
  }

  private apply(school: SchoolProfile): void {
    this.name.set(school.name);
    this.shortName.set(school.shortName ?? '');
    this.schoolType.set(school.type);
    this.email.set(school.email);
    this.phone.set(school.phone);
    this.website.set(school.website ?? '');
    this.address.set(school.address);
    this.currency.set(school.currency || 'USD');
  }
}
