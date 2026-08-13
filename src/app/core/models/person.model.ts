import { BaseEntity } from './base.model';
import { PersonType, Status } from './enums';

export interface StudentDetails {
  admissionNumber?: string;
  classId?: string;
  guardianPersonIds?: string[];
}

export interface TeacherDetails {
  employeeNumber?: string;
  subjectIds?: string[];
}

export interface ParentDetails {
  studentPersonIds?: string[];
}

/**
 * 11-people.md: Students, Teachers, and Parents share one Person model with
 * configurable terminology rather than three separate systems. `type` selects
 * which detail block below applies.
 */
export interface Person extends BaseEntity {
  branchIds: string[];
  type: PersonType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  status: Status;

  studentDetails?: StudentDetails;
  teacherDetails?: TeacherDetails;
  parentDetails?: ParentDetails;
}
