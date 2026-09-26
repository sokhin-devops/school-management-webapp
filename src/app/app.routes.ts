import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { twoFactorGuard } from './core/guards/two-factor.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/onboarding/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'onboarding/plan',
    loadComponent: () =>
      import('./features/onboarding/choose-plan/choose-plan.component').then((m) => m.ChoosePlanComponent),
  },
  {
    path: 'onboarding/school-setup',
    loadComponent: () =>
      import('./features/onboarding/school-setup/school-setup.component').then((m) => m.SchoolSetupComponent),
  },
  {
    // 67-security.md: where a school that requires two-factor sends anyone who has not set it up.
    path: 'two-factor-setup',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/two-factor-page/two-factor-page.component').then((m) => m.TwoFactorPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./features/layouts/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard, twoFactorGuard],
    // Applied to the children rather than to each route: a module added later
    // is guarded by being here, not by remembering to guard it.
    canActivateChild: [permissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'academic/programs',
        loadComponent: () => import('./features/academic/program/program.component').then((m) => m.ProgramComponent),
      },
      {
        path: 'academic/levels',
        loadComponent: () => import('./features/academic/level/level.component').then((m) => m.LevelComponent),
      },
      {
        path: 'academic/classes',
        loadComponent: () => import('./features/academic/class-group/class-group.component').then((m) => m.ClassGroupComponent),
      },
      {
        path: 'academic/subjects',
        loadComponent: () => import('./features/academic/subject/subject.component').then((m) => m.SubjectComponent),
      },
      {
        path: 'academic/academic-years',
        loadComponent: () => import('./features/academic/academic-year/academic-year.component').then((m) => m.AcademicYearComponent),
      },
      {
        path: 'academic/rooms',
        loadComponent: () => import('./features/academic/room/room.component').then((m) => m.RoomComponent),
      },

      {
        path: 'people/students',
        loadComponent: () => import('./features/people/student/student.component').then((m) => m.StudentComponent),
        data: { layouts: true },
      },
      {
        path: 'people/teachers',
        loadComponent: () => import('./features/people/teacher/teacher.component').then((m) => m.TeacherComponent),
        data: { layouts: true },
      },
      {
        path: 'people/parents',
        loadComponent: () => import('./features/people/parent/parent.component').then((m) => m.ParentComponent),
        data: { layouts: true },
      },

      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent),
      },
      {
        path: 'exams',
        loadComponent: () => import('./features/exam/exam.component').then((m) => m.ExamComponent),
      },

      {
        path: 'finance/fees',
        loadComponent: () => import('./features/finance/fee/fee.component').then((m) => m.FeeComponent),
      },
      {
        path: 'finance/payments',
        loadComponent: () => import('./features/finance/payment/payment.component').then((m) => m.PaymentComponent),
      },
      {
        path: 'finance/expenses',
        loadComponent: () => import('./features/finance/expense/expense.component').then((m) => m.ExpenseComponent),
      },
      {
        path: 'finance/reports',
        loadComponent: () => import('./features/finance/finance-report/finance-report.component').then((m) => m.FinanceReportComponent),
      },

      {
        path: 'reports/students',
        loadComponent: () => import('./features/report/student-report/student-report.component').then((m) => m.StudentReportComponent),
      },
      {
        path: 'reports/attendance',
        loadComponent: () => import('./features/report/attendance-report/attendance-report.component').then((m) => m.AttendanceReportComponent),
      },
      {
        path: 'reports/academic',
        loadComponent: () => import('./features/report/academic-report/academic-report.component').then((m) => m.AcademicReportComponent),
      },
      {
        path: 'reports/financial',
        loadComponent: () => import('./features/report/financial-report/financial-report.component').then((m) => m.FinancialReportComponent),
      },

      {
        path: 'settings/school',
        loadComponent: () => import('./features/settings/school/school.component').then((m) => m.SchoolComponent),
      },
      {
        path: 'settings/branches',
        loadComponent: () => import('./features/settings/branch/branch.component').then((m) => m.BranchComponent),
      },
      {
        path: 'settings/academic',
        loadComponent: () => import('./features/settings/academic-settings/academic-settings.component').then((m) => m.AcademicSettingsComponent),
      },
      {
        path: 'settings/users-roles',
        loadComponent: () =>
          import('./features/settings/users-roles/users-roles.component').then((m) => m.UsersRolesComponent),
      },
      {
        path: 'settings/notifications',
        loadComponent: () => import('./features/settings/notifications/notification-settings.component').then((m) => m.NotificationSettingsComponent),
      },
      {
        path: 'settings/appearance',
        loadComponent: () => import('./features/settings/appearance/appearance.component').then((m) => m.AppearanceComponent),
      },
      {
        path: 'settings/security',
        loadComponent: () => import('./features/settings/security/security.component').then((m) => m.SecuritySettingsComponent),
      },
      {
        path: 'settings/subscription',
        loadComponent: () => import('./features/settings/subscription/subscription.component').then((m) => m.SubscriptionSettingsComponent),
      },
      {
        path: 'settings/system',
        loadComponent: () => import('./features/settings/system/system.component').then((m) => m.SystemSettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
