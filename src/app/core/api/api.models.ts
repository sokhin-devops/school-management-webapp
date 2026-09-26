/**
 * The shapes the API actually sends and accepts.
 *
 * Kept apart from `core/models`: those describe what a screen works with, these
 * describe what crosses the wire. They agree today, and keeping them separate is
 * what lets one change without dragging the other with it.
 */

/** com.school_management_webapi.dto.response.PagedResponse */
export interface ApiPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Every branch-scoped record carries these. */
export interface ApiRecord {
  id: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export type ApiStatus = 'ACTIVE' | 'INACTIVE';

export interface ApiProgram extends ApiRecord {
  name: string;
  code: string;
  description: string | null;
  status: ApiStatus;
}

export interface ApiSubject extends ApiRecord {
  name: string;
  code: string;
  description: string | null;
  status: ApiStatus;
}

export interface ApiLevel extends ApiRecord {
  programId: string | null;
  name: string;
  displayLabel: string | null;
  order: number | null;
  status: ApiStatus;
}

export interface ApiRoom extends ApiRecord {
  name: string;
  code: string;
  building: string | null;
  kind: string | null;
  capacity: number | null;
  status: ApiStatus;
}

export interface ApiClassGroup extends ApiRecord {
  academicYearId: string;
  programId: string | null;
  levelId: string | null;
  parentClassId: string | null;
  homeroomTeacherId: string | null;
  name: string;
  code: string;
  capacity: number | null;
  status: ApiStatus;
}

export type ApiGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface ApiTeacher extends ApiRecord {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  gender: ApiGender | null;
  dateOfBirth: string | null;
  email: string;
  phone: string | null;
  department: string;
  hireDate: string | null;
  subjectIds: string[];
  status: ApiStatus;
}

export interface ApiParent extends ApiRecord {
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  studentIds: string[];
  status: ApiStatus;
}

export type ApiStudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'SUSPENDED'
  | 'WITHDRAWN';

/** Students predate the branch-scoped modules, so they are keyed by school and their branch is optional. */
export interface ApiStudent {
  id: string;
  schoolId: string;
  branchId: string | null;
  classGroupId: string | null;
  studentCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string | null;
  fullName: string;
  gender: ApiGender;
  dateOfBirth: string;
  nationality: string | null;
  nationalId: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  admissionDate: string;
  status: ApiStudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFee extends ApiRecord {
  academicYearId: string | null;
  name: string;
  category: string;
  amount: number;
  description: string | null;
  status: ApiStatus;
}

export type ApiPaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'ONLINE';
export type ApiPaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED';

export interface ApiPayment extends ApiRecord {
  reference: string;
  feeId: string;
  studentId: string;
  amount: number;
  paidOn: string;
  method: ApiPaymentMethod;
  status: ApiPaymentStatus;
  payerName: string | null;
  notes: string | null;
}

export type ApiExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface ApiExpense extends ApiRecord {
  description: string;
  category: string;
  amount: number;
  spentOn: string;
  status: ApiExpenseStatus;
  attachmentUrl: string | null;
}

export type ApiAssessmentType = 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT';

export interface ApiAssessment extends ApiRecord {
  academicYearId: string | null;
  classGroupId: string;
  subjectId: string;
  name: string;
  type: ApiAssessmentType;
  assessedOn: string;
  maxScore: number;
  averageScore: number | null;
  graded: boolean | null;
}

export type ApiAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface ApiAttendanceRecord extends ApiRecord {
  classGroupId: string;
  studentId: string;
  attendanceDate: string;
  session: string | null;
  status: ApiAttendanceStatus;
  note: string | null;
}

export interface ApiAcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
  terms?: { name: string; startDate: string; endDate: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiBranch {
  id: string;
  schoolId: string;
  name: string;
  address: string;
  phone: string | null;
  mainBranch: boolean;
  status: ApiStatus;
  createdAt: string;
  updatedAt: string;
}

export type ApiPermissionAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

export interface ApiRolePermission {
  module: string;
  actions: ApiPermissionAction[];
}

export interface ApiRole {
  id: string;
  name: string;
  isDefault: boolean;
  defaultType: string | null;
  permissions: ApiRolePermission[];
  branchIds: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTenantUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  membership: string;
  branchIds: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt: string | null;
  createdAt: string;
  twoFactorEnabled?: boolean;
}

export interface ApiDashboardSummary {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  attendanceToday: { present: number; marked: number; percent: number | null };
  collectedThisMonth: number;
  spentThisMonth: number;
  attendanceTrend: { date: string; present: number; marked: number; percent: number | null }[];
  collectionTrend: { month: string; collected: number; spent: number }[];
}
