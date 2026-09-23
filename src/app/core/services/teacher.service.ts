import { Injectable, signal } from '@angular/core';
import { Person, PersonType, Status } from '../models';
import { removeById, upsertById } from '../utils/collection';

/** Teacher row for People > Teachers, denormalized with display-ready subjects. */
export interface TeacherRecord extends Person {
  subjects: string[];
  department: string;
}

function teacher(
  employeeNumber: string,
  firstName: string,
  lastName: string,
  department: string,
  subjects: string[],
  email: string,
  phone: string,
  status: Status = Status.Active,
): TeacherRecord {
  return {
    id: employeeNumber.toLowerCase(),
    branchIds: ['branch-1'],
    type: PersonType.Teacher,
    firstName,
    lastName,
    email,
    phone,
    status,
    department,
    subjects,
    teacherDetails: {
      employeeNumber,
      subjectIds: subjects.map((subject) => subject.toLowerCase().replace(/\s+/g, '-')),
    },
  };
}

function seedTeachers(): TeacherRecord[] {
  return [
    teacher('EMP-2024-001', 'Rachel', 'Owusu', 'Mathematics', ['Mathematics', 'Statistics'], 'rachel.owusu@school.edu', '+1 555-020-2001'),
    teacher('EMP-2024-002', 'Daniel', 'Ferreira', 'Science', ['Physics', 'Chemistry'], 'daniel.ferreira@school.edu', '+1 555-020-2002'),
    teacher('EMP-2024-003', 'Priya', 'Raman', 'Languages', ['English', 'Literature'], 'priya.raman@school.edu', '+1 555-020-2003'),
    teacher('EMP-2024-004', 'Marcus', 'Bennett', 'Humanities', ['History', 'Geography'], 'marcus.bennett@school.edu', '+1 555-020-2004'),
    teacher('EMP-2024-005', 'Chen', 'Wei', 'Science', ['Biology'], 'chen.wei@school.edu', '+1 555-020-2005'),
    teacher('EMP-2024-006', 'Amara', 'Diallo', 'Mathematics', ['Algebra', 'Geometry'], 'amara.diallo@school.edu', '+1 555-020-2006'),
    teacher('EMP-2024-007', 'Tomas', 'Novak', 'Technology', ['Computer Science'], 'tomas.novak@school.edu', '+1 555-020-2007'),
    teacher('EMP-2024-008', 'Helen', 'Castillo', 'Arts', ['Music', 'Drama'], 'helen.castillo@school.edu', '+1 555-020-2008', Status.Inactive),
    teacher('EMP-2024-009', 'Ibrahim', 'Toure', 'Physical Education', ['Sports'], 'ibrahim.toure@school.edu', '+1 555-020-2009'),
    teacher('EMP-2024-010', 'Nadia', 'Haddad', 'Languages', ['French', 'Spanish'], 'nadia.haddad@school.edu', '+1 555-020-2010'),
    teacher('EMP-2024-011', 'Peter', 'Lindqvist', 'Humanities', ['Economics'], 'peter.lindqvist@school.edu', '+1 555-020-2011'),
    teacher('EMP-2024-012', 'Grace', 'Mwangi', 'Arts', ['Visual Arts'], 'grace.mwangi@school.edu', '+1 555-020-2012', Status.Inactive),
  ];
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly _teachers = signal<TeacherRecord[]>(seedTeachers());
  readonly teachers = this._teachers.asReadonly();

  /** Adds the record, or replaces the one already carrying this id. */
  upsert(record: TeacherRecord): void {
    this._teachers.update((current) => upsertById(current, record));
  }

  remove(id: string): void {
    this._teachers.update((current) => removeById(current, id));
  }
}
