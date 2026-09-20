import { Injectable, signal } from '@angular/core';
import { AcademicYear, AcademicYearStatus, Term } from '../models';

function academicYear(
  id: string,
  name: string,
  startDate: string,
  endDate: string,
  status: AcademicYearStatus,
  terms: Term[],
): AcademicYear {
  return { id, branchId: 'branch-1', name, startDate, endDate, status, terms };
}

function semesters(startYear: number): Term[] {
  return [
    { id: `${startYear}-s1`, name: 'Semester 1', startDate: `${startYear}-09-01`, endDate: `${startYear}-12-20` },
    { id: `${startYear}-s2`, name: 'Semester 2', startDate: `${startYear + 1}-01-08`, endDate: `${startYear + 1}-06-30` },
  ];
}

function trimesters(startYear: number): Term[] {
  return [
    { id: `${startYear}-t1`, name: 'Term 1', startDate: `${startYear}-09-01`, endDate: `${startYear}-12-05` },
    { id: `${startYear}-t2`, name: 'Term 2', startDate: `${startYear + 1}-01-08`, endDate: `${startYear + 1}-03-25` },
    { id: `${startYear}-t3`, name: 'Term 3', startDate: `${startYear + 1}-04-08`, endDate: `${startYear + 1}-06-30` },
  ];
}

@Injectable({ providedIn: 'root' })
export class AcademicYearService {
  private readonly _years = signal<AcademicYear[]>([
    academicYear('ay-2026', '2026 - 2027', '2026-09-01', '2027-06-30', AcademicYearStatus.Active, semesters(2026)),
    academicYear('ay-2027', '2027 - 2028', '2027-09-01', '2028-06-30', AcademicYearStatus.Upcoming, semesters(2027)),
    academicYear('ay-2025', '2025 - 2026', '2025-09-01', '2026-06-30', AcademicYearStatus.Completed, semesters(2025)),
    academicYear('ay-2024', '2024 - 2025', '2024-09-01', '2025-06-30', AcademicYearStatus.Completed, semesters(2024)),
    academicYear('ay-2023', '2023 - 2024', '2023-09-01', '2024-06-30', AcademicYearStatus.Completed, trimesters(2023)),
    academicYear('ay-2022', '2022 - 2023', '2022-09-01', '2023-06-30', AcademicYearStatus.Completed, trimesters(2022)),
  ]);

  readonly years = this._years.asReadonly();
}
