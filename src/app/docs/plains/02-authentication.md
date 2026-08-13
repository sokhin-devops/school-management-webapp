# Authentication

## Login

Fields:
- Email
- Password

Actions:
- Login
- Forgot Password?

Successful login -> Dashboard.

## Forgot Password

Login -> Forgot Password -> Enter Email -> Send Reset Link -> Reset Password -> Password Updated -> Login.

Reset fields:
- New Password
- Confirm Password

After successful reset, redirect to Login.

┌──────────────────────────────────────────────────────────────────────────┐
│                         STATIC WEBSITE                                   │
│                                                                          │
│  Home    Features    Pricing    About    FAQ                             │
│                                                                          │
│              [ SIGN UP NOW ]      [ LOGIN ]                              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
        ┌─────────────────┐           ┌─────────────────┐
        │     SIGN UP     │           │      LOGIN      │
        │                 │           │                 │
        │ Name            │           │ Email           │
        │ Email           │           │ Password        │
        │ Password        │           │                 │
        │ Confirm         │           │ [ Login ]       │
        │                 │           │                 │
        │ [ Sign Up ]     │           │ Forgot Password?│───┐
        └────────┬────────┘           └────────┬────────┘   │
                 │                             │            ▼
                 ▼                             │   ┌──────────────────┐
        ┌─────────────────┐                    │   │ FORGOT PASSWORD  │
        │   CHOOSE PLAN   │                    │   │                  │
        │                 │                    │   │      Email       │
        │  Starter        │                    │   │                  │
        │  Professional   │                    │   │[Send Reset Link] │
        │  Enterprise     │                    │   └─────────┬────────┘
        │                 │                    │             │
        │ [ Choose Plan ] │                    │             ▼
        └────────┬────────┘                    │   ┌──────────────────┐
                 │                             │   │  RESET PASSWORD  │
                 ▼                             │   │                  │
╔═══════════════════════════════╗              │   │   New Password   │
║         SCHOOL SETUP          ║              │   │ Confirm Password │
║                               ║              │   │                  │
║   ●━━━━━━━━○━━━━━━━━○         ║              │   │[ Reset Password ]│
║   01       02       03        ║              │   └─────────┬────────┘
║   School   Branch   Academic  ║              │             │
║                      Year     ║              │             ▼
╚══════════════╦════════════════╝              │     ↩ Redirects to LOGIN
               │                               │
               ▼                               │
      ┌──────────────────┐                     │
      │  01 ADD SCHOOL   │                     │
      │                  │                     │
      │ School Name      │                     │
      │ School Type      │                     │
      │ Email            │                     │
      │ Phone            │                     │
      │ Address          │                     │
      │                  │                     │
      │ [ Continue → ]   │                     │
      └────────┬─────────┘                     │
               │                               │
               ▼                               │
      ┌──────────────────┐                     │
      │  02 ADD BRANCH   │                     │
      │                  │                     │
      │ Branch Name      │                     │
      │ Address          │                     │
      │ Phone            │                     │
      │                  │                     │
      │ [ ← Back ]       │                     │
      │ [ Continue → ]   │                     │
      └────────┬─────────┘                     │
               │                               │
               ▼                               │
      ┌──────────────────┐                     │
      │ 03 ACADEMIC YEAR │                     │
      │                  │                     │
      │ Academic Year    │                     │
      │ Start Date       │                     │
      │ End Date         │                     │
      │                  │                     │
      │ [ ← Back ]       │                     │
      │ [ Done ✓ ]       │                     │
      └────────┬─────────┘                     │
               │                               │
               │ Done                          │
               │                               │
               └──────────────┐                │
                              │                │
                              ▼                ▼
                     ╔════════════════════════════╗
                     ║         DASHBOARD          ║
                     ║ Just simple ui the real menu layout will create later   ║
                  
 