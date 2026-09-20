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
    student('STU-2024-0017', 'Zara', 'Ahmed', 'Grade 1 - A', 'zara.ahmed@school.edu', '+1 555-010-1017'),
    student('STU-2024-0018', 'Oscar', 'Bergman', 'Grade 1 - A', 'oscar.bergman@school.edu', '+1 555-010-1018'),
    student('STU-2024-0019', 'Nina', 'Petrova', 'Grade 1 - A', 'nina.petrova@school.edu', '+1 555-010-1019'),
    student('STU-2024-0020', 'Kofi', 'Mensah', 'Grade 1 - A', 'kofi.mensah@school.edu', '+1 555-010-1020'),
    student('STU-2024-0021', 'Leila', 'Haddad', 'Grade 1 - A', 'leila.haddad@school.edu', '+1 555-010-1021'),
    student('STU-2024-0022', 'Diego', 'Silva', 'Grade 1 - A', 'diego.silva@school.edu', '+1 555-010-1022', Status.Inactive),
    student('STU-2024-0023', 'Hana', 'Suzuki', 'Grade 1 - B', 'hana.suzuki@school.edu', '+1 555-010-1023'),
    student('STU-2024-0024', 'Tomas', 'Varga', 'Grade 1 - B', 'tomas.varga@school.edu', '+1 555-010-1024'),
    student('STU-2024-0025', 'Aisha', 'Bello', 'Grade 1 - B', 'aisha.bello@school.edu', '+1 555-010-1025'),
    student('STU-2024-0026', 'Marco', 'Rossi', 'Grade 1 - B', 'marco.rossi@school.edu', '+1 555-010-1026'),
    student('STU-2024-0027', 'Freya', 'Lindholm', 'Grade 1 - B', 'freya.lindholm@school.edu', '+1 555-010-1027'),
    student('STU-2024-0028', 'Ravi', 'Sharma', 'Grade 2 - A', 'ravi.sharma@school.edu', '+1 555-010-1028'),
    student('STU-2024-0029', 'Clara', 'Dubois', 'Grade 2 - A', 'clara.dubois@school.edu', '+1 555-010-1029'),
    student('STU-2024-0030', 'Yusuf', 'Karim', 'Grade 2 - A', 'yusuf.karim@school.edu', '+1 555-010-1030'),
    student('STU-2024-0031', 'Maya', 'Goldberg', 'Grade 2 - A', 'maya.goldberg@school.edu', '+1 555-010-1031'),
    student('STU-2024-0032', 'Sebastian', 'Vogel', 'Grade 2 - A', 'sebastian.vogel@school.edu', '+1 555-010-1032'),
    student('STU-2024-0033', 'Amina', 'Diop', 'Grade 2 - B', 'amina.diop@school.edu', '+1 555-010-1033'),
    student('STU-2024-0034', 'Henrik', 'Dahl', 'Grade 2 - B', 'henrik.dahl@school.edu', '+1 555-010-1034'),
  ];
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly _students = signal<StudentRecord[]>(seedStudents());
  readonly students = this._students.asReadonly();
}
