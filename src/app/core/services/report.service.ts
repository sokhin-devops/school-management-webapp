import { Injectable, signal } from '@angular/core';

/**
 * 50-reports.md: the reporting framework is shared and only the templates differ,
 * so every report's rows live here rather than in four near-identical services.
 */

export interface EnrolmentRow {
  readonly className: string;
  readonly enrolled: number;
  readonly capacity: number;
  readonly active: number;
  readonly inactive: number;
}

export interface AttendanceRow {
  readonly className: string;
  readonly sessions: number;
  readonly present: number;
  readonly absent: number;
  readonly late: number;
}

export interface AcademicRow {
  readonly subject: string;
  readonly assessments: number;
  readonly average: number;
  readonly highest: number;
  readonly lowest: number;
  readonly passRate: number;
}

export interface FinancialRow {
  readonly category: string;
  readonly invoiced: number;
  readonly collected: number;
}

export interface LedgerRow {
  readonly month: string;
  readonly collected: number;
  readonly outstanding: number;
  readonly expenses: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  readonly enrolment = signal<EnrolmentRow[]>([
    { className: 'Grade 1 - A', enrolled: 32, capacity: 35, active: 31, inactive: 1 },
    { className: 'Grade 1 - B', enrolled: 30, capacity: 35, active: 30, inactive: 0 },
    { className: 'Grade 2 - A', enrolled: 28, capacity: 35, active: 27, inactive: 1 },
    { className: 'Grade 2 - B', enrolled: 26, capacity: 35, active: 25, inactive: 1 },
    { className: 'Grade 3 - A', enrolled: 31, capacity: 35, active: 31, inactive: 0 },
    { className: 'Grade 3 - B', enrolled: 29, capacity: 35, active: 28, inactive: 1 },
    { className: 'Grade 4 - A', enrolled: 33, capacity: 35, active: 33, inactive: 0 },
    { className: 'Grade 4 - B', enrolled: 27, capacity: 35, active: 26, inactive: 1 },
    { className: 'Grade 5 - A', enrolled: 30, capacity: 35, active: 29, inactive: 1 },
    { className: 'Grade 5 - B', enrolled: 25, capacity: 35, active: 25, inactive: 0 },
    { className: 'Grade 6 - A', enrolled: 34, capacity: 35, active: 34, inactive: 0 },
    { className: 'Grade 6 - B', enrolled: 28, capacity: 35, active: 27, inactive: 1 },
    { className: 'Grade 7 - A', enrolled: 35, capacity: 35, active: 34, inactive: 1 },
    { className: 'Grade 7 - B', enrolled: 31, capacity: 35, active: 31, inactive: 0 },
  ]).asReadonly();

  readonly attendance = signal<AttendanceRow[]>([
    { className: 'Grade 1 - A', sessions: 18, present: 546, absent: 18, late: 12 },
    { className: 'Grade 1 - B', sessions: 18, present: 512, absent: 26, late: 2 },
    { className: 'Grade 2 - A', sessions: 18, present: 481, absent: 21, late: 2 },
    { className: 'Grade 2 - B', sessions: 18, present: 447, absent: 19, late: 2 },
    { className: 'Grade 3 - A', sessions: 18, present: 534, absent: 20, late: 4 },
    { className: 'Grade 3 - B', sessions: 18, present: 497, absent: 24, late: 1 },
    { className: 'Grade 4 - A', sessions: 18, present: 571, absent: 17, late: 6 },
    { className: 'Grade 4 - B', sessions: 18, present: 462, absent: 25, late: 13 },
    { className: 'Grade 5 - A', sessions: 18, present: 518, absent: 22, late: 0 },
    { className: 'Grade 5 - B', sessions: 18, present: 428, absent: 18, late: 4 },
    { className: 'Grade 6 - A', sessions: 18, present: 589, absent: 16, late: 7 },
    { className: 'Grade 6 - B', sessions: 18, present: 481, absent: 23, late: 0 },
  ]).asReadonly();

  readonly academic = signal<AcademicRow[]>([
    { subject: 'Mathematics', assessments: 12, average: 74.2, highest: 98, lowest: 41, passRate: 88.5 },
    { subject: 'Physics', assessments: 9, average: 69.8, highest: 95, lowest: 34, passRate: 81.2 },
    { subject: 'Chemistry', assessments: 9, average: 71.4, highest: 96, lowest: 38, passRate: 84.0 },
    { subject: 'Biology', assessments: 8, average: 76.1, highest: 99, lowest: 45, passRate: 91.3 },
    { subject: 'English', assessments: 14, average: 78.6, highest: 97, lowest: 52, passRate: 94.1 },
    { subject: 'Literature', assessments: 7, average: 72.9, highest: 94, lowest: 44, passRate: 86.7 },
    { subject: 'History', assessments: 8, average: 70.3, highest: 92, lowest: 39, passRate: 82.4 },
    { subject: 'Geography', assessments: 7, average: 73.5, highest: 93, lowest: 46, passRate: 88.0 },
    { subject: 'Computer Science', assessments: 10, average: 80.2, highest: 100, lowest: 55, passRate: 95.6 },
    { subject: 'Economics', assessments: 6, average: 68.4, highest: 90, lowest: 33, passRate: 78.9 },
  ]).asReadonly();

  readonly financial = signal<FinancialRow[]>([
    { category: 'Tuition', invoiced: 168400, collected: 151200 },
    { category: 'Registration', invoiced: 14250, collected: 13800 },
    { category: 'Transportation', invoiced: 22500, collected: 19350 },
    { category: 'Laboratory', invoiced: 9600, collected: 8880 },
    { category: 'Materials', invoiced: 12150, collected: 11400 },
    { category: 'Examination', invoiced: 5040, collected: 4920 },
    { category: 'Activities', invoiced: 10500, collected: 8750 },
  ]).asReadonly();

  readonly ledger = signal<LedgerRow[]>([
    { month: 'April', collected: 14200, outstanding: 5100, expenses: 11800 },
    { month: 'May', collected: 15800, outstanding: 4800, expenses: 12400 },
    { month: 'June', collected: 16400, outstanding: 4600, expenses: 13100 },
    { month: 'July', collected: 17100, outstanding: 4400, expenses: 12250 },
    { month: 'August', collected: 17900, outstanding: 4100, expenses: 14600 },
    { month: 'September', collected: 18400, outstanding: 4250, expenses: 13900 },
  ]).asReadonly();
}
