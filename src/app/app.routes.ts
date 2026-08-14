import { Routes } from '@angular/router';

const comingSoon = (title: string) => ({
  loadComponent: () =>
    import('./share/components/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent),
  data: { title },
});

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
    path: '',
    loadComponent: () => import('./features/layouts/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      { path: 'academic/programs', ...comingSoon('Programs') },
      { path: 'academic/levels', ...comingSoon('Levels') },
      { path: 'academic/classes', ...comingSoon('Classes') },
      { path: 'academic/subjects', ...comingSoon('Subjects') },
      { path: 'academic/academic-years', ...comingSoon('Academic Years') },
      { path: 'academic/rooms', ...comingSoon('Rooms') },

      {
        path: 'people/students',
        loadComponent: () => import('./features/people/student/student.component').then((m) => m.StudentComponent),
      },
      { path: 'people/teachers', ...comingSoon('Teachers') },
      { path: 'people/parents', ...comingSoon('Parents') },

      { path: 'attendance', ...comingSoon('Attendance') },
      { path: 'exams', ...comingSoon('Exams / Assessments') },

      { path: 'finance/fees', ...comingSoon('Fees') },
      { path: 'finance/payments', ...comingSoon('Payments') },
      { path: 'finance/expenses', ...comingSoon('Expenses') },
      { path: 'finance/reports', ...comingSoon('Financial Reports') },

      { path: 'reports/students', ...comingSoon('Student Reports') },
      { path: 'reports/attendance', ...comingSoon('Attendance Reports') },
      { path: 'reports/academic', ...comingSoon('Academic Reports') },
      { path: 'reports/financial', ...comingSoon('Financial Reports') },

      {
        path: 'settings/school',
        loadComponent: () => import('./features/settings/school/school.component').then((m) => m.SchoolComponent),
      },
      {
        path: 'settings/branches',
        loadComponent: () => import('./features/settings/branch/branch.component').then((m) => m.BranchComponent),
      },
      { path: 'settings/academic', ...comingSoon('Academic Settings') },
      { path: 'settings/users-roles', ...comingSoon('Users & Roles') },
      { path: 'settings/notifications', ...comingSoon('Notifications') },
      {
        path: 'settings/appearance',
        loadComponent: () => import('./features/settings/appearance/appearance.component').then((m) => m.AppearanceComponent),
      },
      { path: 'settings/security', ...comingSoon('Security') },
      { path: 'settings/subscription', ...comingSoon('Subscription') },
      { path: 'settings/system', ...comingSoon('System') },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
