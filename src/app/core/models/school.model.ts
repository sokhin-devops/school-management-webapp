import { BaseEntity } from './base.model';
import { SchoolType } from './enums';

/** 61-school-settings.md: Identity / Contact Information / Address fieldsets. */
export interface School extends BaseEntity {
  name: string;
  type: SchoolType;
  logoUrl?: string;

  email?: string;
  phone?: string;
  website?: string;

  address?: string;
  city?: string;
  country?: string;
}
