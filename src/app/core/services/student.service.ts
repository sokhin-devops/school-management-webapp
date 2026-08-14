import { Injectable, signal } from '@angular/core';
import { Person, PersonType, Status } from '../models';

/** Student row shown in the People > Students dataview, denormalized with a display-ready class name. */
export interface StudentRecord extends Person {
  className: string;
}

function student(
  admissionNumber: string,
  firstName: string,
  lastName: string,
  className: string,
  email: string,
  phone: string,
  status: Status = Status.Active,
): StudentRecord {
  return {
    id: admissionNumber.toLowerCase(),
    branchIds: ['branch-1'],
    type: PersonType.Student,
    firstName,
    lastName,
    email,
    phone,
    status,
    className,
    studentDetails: {
      admissionNumber,
      classId: className.toLowerCase().replace(/\s+/g, '-'),
    },
  };
}

function seedStudents(): StudentRecord[] {
  return [
    student('STU-2024-0001', 'Aiden', 'Carter', 'Grade 1 - A', 'aiden.carter@school.edu', '+1 555-010-1001'),
    student('STU-2024-0002', 'Sophia', 'Nguyen', 'Grade 1 - B', 'sophia.nguyen@school.edu', '+1 555-010-1002'),
    student('STU-2024-0003', 'Liam', 'Johnson', 'Grade 2 - A', 'liam.johnson@school.edu', '+1 555-010-1003'),
    student(
      'STU-2024-0004',
      'Olivia',
      'Martinez',
      'Grade 2 - B',
      'olivia.martinez@school.edu',
      '+1 555-010-1004',
      Status.Inactive,
    ),
    student('STU-2024-0005', 'Noah', 'Williams', 'Grade 3 - A', 'noah.williams@school.edu', '+1 555-010-1005'),
    student('STU-2024-0006', 'Emma', 'Brown', 'Grade 3 - B', 'emma.brown@school.edu', '+1 555-010-1006'),
    student('STU-2024-0007', 'Elijah', 'Davis', 'Grade 4 - A', 'elijah.davis@school.edu', '+1 555-010-1007'),
    student('STU-2024-0008', 'Ava', 'Garcia', 'Grade 4 - B', 'ava.garcia@school.edu', '+1 555-010-1008'),
    student(
      'STU-2024-0009',
      'Lucas',
      'Rodriguez',
      'Grade 5 - A',
      'lucas.rodriguez@school.edu',
      '+1 555-010-1009',
      Status.Inactive,
    ),
    student('STU-2024-0010', 'Mia', 'Hernandez', 'Grade 5 - B', 'mia.hernandez@school.edu', '+1 555-010-1010'),
    student('STU-2024-0011', 'Mason', 'Lopez', 'Grade 6 - A', 'mason.lopez@school.edu', '+1 555-010-1011'),
    student('STU-2024-0012', 'Isabella', 'Gonzalez', 'Grade 6 - B', 'isabella.gonzalez@school.edu', '+1 555-010-1012'),
    student('STU-2024-0013', 'Ethan', 'Wilson', 'Grade 7 - A', 'ethan.wilson@school.edu', '+1 555-010-1013'),
    student('STU-2024-0014', 'Amelia', 'Anderson', 'Grade 7 - B', 'amelia.anderson@school.edu', '+1 555-010-1014'),
    student('STU-2024-0015', 'Logan', 'Thomas', 'Grade 8 - A', 'logan.thomas@school.edu', '+1 555-010-1015'),
    student('STU-2024-0016', 'Charlotte', 'Taylor', 'Grade 8 - B', 'charlotte.taylor@school.edu', '+1 555-010-1016'),
  ];
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly _students = signal<StudentRecord[]>(seedStudents());
  readonly students = this._students.asReadonly();
}
