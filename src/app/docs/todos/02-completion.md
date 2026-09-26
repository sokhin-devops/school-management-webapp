# TODO — Completion pass

The last pass before the system can be called finished: everything a screen
offers must work against the API, and what the specs ask for must exist.

This file is also the resume point for unattended sessions. Work top to bottom;
tick an item only once it is built **and** checked once against the running
API + app. Note any judgment call under the item it belongs to.

Servers: API `cd school-management-webapi && ./gradlew bootRun` (:8081),
web `cd school-management-webapp && npx ng serve --port 4200`.

**C: is full** (2026-09-25: 0 bytes free; two 8.9 GB Gradle heap dumps from an
unrelated Flutter build in `~/.gradle/daemon/8.12/` are most of the waste — left
for the owner to delete). PostgreSQL's data is on C:, so keep writes there
minimal. Unattended runs use `/d/claude-tooling/run-api.sh` and
`/d/claude-tooling/wait-api.sh`, which put Gradle's home and all temp files on
D:, and set `TEMP` and `TMP` to `D:\claude-tooling\tmp` before running
Playwright. No screenshots.

## A. Every row action works

Audit (2026-09-25): no list page wires `(view)` or `(remove)` — the eye and
trash icons do nothing — and `saveError` is set on 14 pages but rendered on none,
so a refused save disappears silently.

- [x] A1. Global `<k-confirm-delete-dialog />` in the layout and one
      `RecordRemovalService` (confirm → `remove` → toast). The dialog reads its
      text from the service: PrimeNG gives a confirm dialog's `#header` template
      no context, and an exception there blanked the body and buttons.
- [x] A2. Delete on every list page, card grid and drawer. Branches had no API
      save or delete at all — now `BranchContextService.save/remove`; the API
      refuses deleting a school's last branch (409 `LAST_BRANCH`), since a school
      with none could not even be given a branch again from the app.
- [x] A3. `SaveState`, provided per page and injected by `k-form-dialog`: the
      form stays open with a spinner, shows a refusal above the fields with the
      draft intact, and closes with a toast on success. Forms no longer close
      themselves. (Plan limits are one such refusal: Starter allows one branch.)
- [x] A4. `k-record-drawer` — right-side, read-only, Edit/Delete gated by the
      role grid. Each page lists its record's facts in `describe()`. The
      `student-details` CLI stub was unreferenced and is removed.
- [x] A5. Payments had no actions column: added, with a delete warning that
      reversing money is an edit to Refunded, not a delete.
      Verified live 18/18, no console errors (save, forced refusal, view,
      view→edit, delete, last-branch guard, plan-limit refusal).

## B. Auth bug

- [x] B1. Every JWT now carries a random `jti`; two issued in the same second
      were byte-identical and the refresh token's unique hash index refused the
      second (409). Verified: register + two back-to-back logins → 201/200/200.
- [x] B2. A malformed `sm_user` in localStorage crashed the app at start-up
      (`JSON.parse("undefined")` in the auth service's constructor). Token
      storage now treats unreadable values as signed out.

## C. Settings persist to the API

Audit: every settings page except School/Branches/Users is local signals and
hard-coded rows — including the subscription page (fake plan, usage and
invoices) and System's "Environment" facts (fake version and region).

Design: one `TenantSettings` row per tenant with typed embedded sections
(security, academic, system, billing); per-user notification preferences;
sessions from refresh tokens; an audit table. A setting that the system does
not act on is removed rather than persisted for show.

- [x] C1. API: `TenantSettings` + `GET/PUT /api/v1/settings/{security,academic,system}`.
      `GET academic` readable by anyone signed in (it drives everyone's menu).
- [x] C2. Notifications (65): per-user preferences `GET/PUT
      /api/v1/notifications/preferences`; real in-app notifications raised by
      the events the page lists; bell in the topbar (G3). Email and push shown
      as coming soon — nothing sends mail. Events with no module behind them
      (timetable, invoices, parent messages) are dropped from the list.
- [x] C3. Security (67): password policy enforced on reset (and expiry at
      login); sign-out-everywhere honoured; session timeout enforced on
      refresh; active sessions from refresh tokens (device, IP, last used,
      revoke); audit log recorded for sign-ins, failures, resets, user/role and
      settings changes. Two-factor: built, see C8.
- [x] C4. Academic settings (63): persisted; switching a concept off hides its
      page from the menu and its route; the school's terms rename the menu and
      page trail; active year chosen from real years; pass mark feeds the
      academic report; grading scale drives Exams and the Academic report.
      API checked 43/43 together with C2–C6.
- [x] C4b. Sections and terms: class form has "Section of"; academic years
      have terms (API: owned, ordered list, validated inside the year and
      non-overlapping; web: editor with "Fill in N semesters/terms/quarters").
      Both hidden when the school switches them off.

## A2. Forms that could not create anything (found 2026-09-26)

Leftovers of the mock phase, invisible until a form is used against the API:
choices built from *existing* records (so a new school had no level, class,
category, department or room kind to pick - and each was required), and
relationships sent as names or slugs of names where the API takes ids.

- [x] Class: level/program/teacher/year by id from their own services; code
      required as the API has it; enrolment counted from students.
- [x] Level (program), Student (class, optional; email optional), Teacher
      (subjects, optional; department editable with defaults), Parent
      (children, optional), Fee (real year, not 'ay-2026'; categories with
      defaults), Payment (student + fee by id, amount from the fee, payer),
      Expense (categories with defaults), Room (kind/building optional),
      Assessment (class by id), User (role + branches by id), Role (branches
      by id; permissions as the checkbox tree 64 asks for), Academic year
      (schoolId was never sent; terms), Branch (address required as the API
      has it). Money inputs use the school's currency.
- [x] Refusals list the fields the server named, not just "Validation failed".
- [x] Verified: one of every record created through the real forms, then read
      back from the API with every relationship checked by id - 32/32, no
      console errors.
- [x] Users & Roles froze the tab (the "HMR quirk" of the earlier notes - it
      is not HMR). FloatingScrollDirective's MutationObserver looped on a list
      shell detached from the document (the inactive tab): off-page elements
      read as disconnected, so every scan disposed and re-attached, and each
      re-attach fired the next scan. Scans now skip a detached host, ignore
      mutations that are only its own thumbs, and resume on host resize.
- [x] C5. System (69), owner/admin only: real environment facts
      (`/api/v1/system/info`); maintenance mode enforced (non-owners refused);
      export all data (JSON); delete all school data (owner, type-to-confirm,
      soft delete). Import, clear cache, retention and close-account removed:
      nothing behind them, and 69 asks for no unnecessary complexity.
- [x] C6. Subscription (68): real plan facts, usage from real counts, change
      plan and cancel through the existing API, billing email/address stored,
      invoices recorded when a plan is chosen or changed, printable invoice.
- [x] C7. School settings (61) wired to the API (short name, website and
      currency added to the school; timezone and language removed - nothing
      applied them, and there are no translations). The currency drives every
      money figure. Appearance (66): every control applies, remembered per
      device, which suits visual preferences.
      Verified C2-C7, G and H1 live: 31/31, no console errors (school name in
      sidebar, real user in topbar, no seeded names on the dashboard, help and
      bell, currency KHR end to end, concept off hides menu and route, rename
      shows in the menu, preferences from the server, sessions and audit,
      real version, real plan/usage/invoice, logout ends the server session).
- [x] C8. Two-factor sign-in (TOTP) — optional, last in C.
      API: `Totp` (RFC 6238, HMAC-SHA1, 30 s, six digits, one step either
      side, checked against the RFC's vectors in `TotpTest`); a code is spent
      once (last accepted step kept on the user). With two-factor on,
      `/auth/login` answers only a five-minute `twoFactorToken`, which the
      authentication filter refuses; `/auth/login/two-factor` exchanges it
      with an app code or a recovery code (eight, hashed, each works once) for
      a session - five wrong codes and the password step starts again.
      `/auth/two-factor` (status, setup, enable, recovery-codes, disable) and
      `DELETE /users/{id}/two-factor` for an admin's reset. "Require
      two-factor" in Security is real: whoever turns it on must have it
      themselves, and anyone without it gets 403 TWO_FACTOR_SETUP_REQUIRED
      outside /auth until they set it up.
      Web: account menu > Two-factor sign-in (QR code drawn by a lazily loaded
      `qrcode`, key to type by hand, confirm with a code, recovery codes to
      copy or download; new codes; turn off with password and code); the
      login page's code step; `/two-factor-setup` for a school that requires
      it (guard, and the interceptor for a requirement switched on
      mid-session); the user drawer shows two-factor and offers the reset.
      `EnumConstraintSync` rebuilds the audit table's CHECK list of actions at
      start-up - Hibernate never updates it, and new actions were silently
      refused. Verified 24/24 end to end with real TOTP codes.

## I. Plans sell features that nothing enforces

Found 2026-09-26: `FeatureAccessService` exists and is never called. Starter
excludes Finance, Exams, Grades, Reports, custom roles and multiple branches,
yet a Starter school gets all of them except the branch count (a limit).

- [x] I1. API: the permission interceptor refuses a module the plan lacks
      (403 FEATURE_NOT_AVAILABLE, naming the feature). No active subscription
      means no gating, rather than a lockout.
- [x] I2. Web: `/auth/me/permissions` carries the plan's features; the menu
      hides what the plan lacks; a typed URL lands on Subscription with a note
      saying which plans include it; Create Role hidden without custom roles.
      Verified 19/19: Starter refused finance/reports/exams/role writes with
      the feature named, allowed students/attendance/role reads; Professional
      allowed all; Starter's menu, dashboard, typed URL and roles tab follow.

## D. Public website

Lives in the sibling project `../school-management-website` (not in this app —
`01-public-website.md` predates the split). Sections exist; nothing is wired.

- [x] D1. Builds and serves; all 14 sections of 01-public-website.md present
      (the page composes 12 — Final CTA is missing from the shell).
- [x] D2. Pricing reads the live `/api/v1/plans` (public endpoint).
- [x] D3. CTAs go to the webapp's `/signup` and `/login`, from one configured
      app URL rather than hard-coded links.
      Built: environment (apiUrl, appUrl), HTTP client, live pricing (prices,
      yearly price, limits, enabled features only - Starter no longer
      advertised Finance or "Email Notifications"), Final CTA section, port
      4300 (already in the API's CORS list). Verified 22/22 at 1440px and
      390px. Pricing cards pass `?plan=`; the webapp's sign-up carries it to
      the plan picker, which was itself showing invented prices ($29/$79/
      Custom against the real $19/$49/$199) and is now built from the API,
      with a monthly/yearly choice.
      Left: footer Contact, Privacy Policy and Terms of Service link to `#` -
      they need content only the business can write.

## E. Build health

- [x] E1. `ng build` (production) passes its budgets — by splitting what does not
      need to be initial, not only by raising the number.
      The app shell imported the loader through the share barrel, which pulled
      every shared component (and its PrimeNG modules) into the initial chunk.
      Importing it directly: 1.29 MB raw / ~173 kB transferred, under the
      1.4 MB warning. The website's components import their own PrimeNG
      modules instead of KShareModule: 2.04 MB → 1.04 MB.
- [x] E2. `dashboard.component.scss` under its 4 kB warning (feed and meter
      styles moved to the shared card.scss).
- [x] E3. Web and API test suites green. API 49/49 (adds ModulePermissionsTest, TotpTest
      and PasswordPolicyServiceTest); webapp 1/1; the website has no specs.

## G. Shell

- [x] G1. Logout actually signs out (it only navigated to /login; tokens and
      the server session survived).
- [x] G2. Topbar shows the signed-in user, not "Account Owner".
- [x] G3. Notifications bell: unread badge, recent list, mark read (C2).
- [x] G4. Help menu (06-topbar.md).

## H. Seeded data still on screen

- [x] H1. Dashboard: students by program/level/class, class capacity (from
      placed students), notifications (the bell's feed) and recent activity
      (the audit log, for roles that can see Settings) are real. The fee chart
      is collected against spent; its "outstanding" bars were a constant.
      Money in the school's currency.
- [x] H2. Sidebar brand read "Norton University"; it shows the school's short
      name (or name) now. Unused mock `security.service.ts` deleted.

## F. Finish

- [x] F1. End-to-end walkthrough: sign up → plan → school setup → a record in
      every module → reports; fix what breaks.
      Walked from the website's Professional card through sign-up, the plan
      picker (the card chosen on the site is the featured one), the setup
      wizard, a record in every module through its form, marks, a register,
      and every report - 43/43, no refused calls, no console errors. Broke on
      the way and fixed:
      - Picking any school type but the default crashed the wizard: the select
        had no optionValue, so the form held the option object.
      - The Branch and Academic steps never showed why the server refused them.
      - Labels on the password, school type and date fields pointed at the
        PrimeNG wrapper (id) rather than the input (inputId).
      - Marks could not be entered at all: the API had the mark sheet, the app
        had no screen for it. Exams now has "Enter marks" per assessment (Edit
        permission and the Grades feature), a class roster with score and
        remark, and a live average in the school's grading scale.
- [x] F2. Stale todo docs (00-ui-buildout, 01-api-integration, 01-public-website)
      brought in line with what is true. 12-students.md's "next" list too.
      01-public-website.md now says the site is its own project, with live
      pricing and CTAs into this app; the footer's legal links stay open.
