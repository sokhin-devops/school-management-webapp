import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SettingsSectionComponent } from '../../../share/components';
import { SchoolType } from '../../../core/models';

/** 61-school-settings.md — the school's own profile, contact details and branding. */
@Component({
  selector: 'app-school',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule, SettingsSectionComponent],
  templateUrl: './school.component.html',
  styleUrl: './school.component.scss',
})
export class SchoolComponent {
  protected readonly name = signal('Riverside International School');
  protected readonly shortName = signal('RIS');
  protected readonly schoolType = signal<SchoolType>(SchoolType.SecondarySchool);
  protected readonly email = signal('office@riverside.edu');
  protected readonly phone = signal('+1 555-000-1000');
  protected readonly website = signal('https://riverside.edu');
  protected readonly address = signal('128 Riverside Avenue\nPhnom Penh, Cambodia');
  protected readonly timezone = signal('Asia/Phnom_Penh');
  protected readonly currency = signal('USD');
  protected readonly language = signal('en');

  /**
   * 00-product-overview.md: one platform serves every institution type, so the
   * type is a setting rather than a separate deployment.
   */
  protected readonly schoolTypeOptions = [
    { label: 'Primary school', value: SchoolType.PrimarySchool },
    { label: 'Secondary school', value: SchoolType.SecondarySchool },
    { label: 'High school', value: SchoolType.HighSchool },
    { label: 'College', value: SchoolType.College },
    { label: 'University', value: SchoolType.University },
    { label: 'Language center', value: SchoolType.LanguageCenter },
    { label: 'Training center', value: SchoolType.TrainingCenter },
    { label: 'Vocational school', value: SchoolType.VocationalSchool },
    { label: 'Other', value: SchoolType.Other },
  ];

  protected readonly timezoneOptions = [
    { label: 'Asia/Phnom_Penh (GMT+7)', value: 'Asia/Phnom_Penh' },
    { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
    { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
    { label: 'Europe/London (GMT+0)', value: 'Europe/London' },
    { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  ];

  protected readonly currencyOptions = [
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'KHR — Cambodian Riel', value: 'KHR' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'GBP — British Pound', value: 'GBP' },
  ];

  protected readonly languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'ភាសាខ្មែរ (Khmer)', value: 'km' },
  ];
}
