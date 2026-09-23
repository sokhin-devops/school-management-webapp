# TODO — System-wide UI build-out

Covers every page in [`../plains/05-sidebar-navigation.md`](../plains/05-sidebar-navigation.md).

Status: **All 29 routes are real pages.** `app.routes.ts` no longer contains a single `comingSoon` placeholder, and the helper itself has been deleted. Verified with `ng build` (production) and a headless-browser sweep of all 29 routes in **both light and dark** — 29/29 clean, meaning the route resolved, the body rendered, and the console was silent.

## What each page is built from

Nothing here re-solves a toolbar, a scroll layout or an empty state. Three archetypes cover the whole nav.

| Archetype | Built from | Used by |
|---|---|---|
| **Record list** | `k-list-shell` + `k-list-toolbar` + `createRecordList` + `k-table` + `p-paginator` | People (3), Academic (6), Finance (3), Exams, Settings › Branches, Settings › Users & Roles |
| **Settings / detail** | `.k-page-scroll` + a stack of `k-settings-section` + `.k-field` / `.k-pref-row` / `.k-facts` | Settings › School, Academic, Notifications, Security, Subscription, System |
| **Report** | `k-list-shell` with a plain filter row in the toolbar slot + a `.k-facts` figures card + a read-only table | Reports (4), Finance › Financial Reports |

Attendance is the one page that is none of these: a roster workspace with date / class / session pickers, per-student P·A·L·E marking and a live tally.

## Kit added this pass

- **[`share/data/record-list.ts`](../../share/data/record-list.ts)** — `createRecordList` + `RecordFilter` own search, filtering, sorting, paging, the "12 of 40 students" label, and clear-all. This is why a new list page is ~50 lines of TS instead of ~190. Sorting lives here rather than in `p-table` because paging is external: letting the table sort would only reorder the rows already on screen.
- **[`share/data/format.ts`](../../share/data/format.ts)** — `money`, `percent`, `humanize`. One `Intl` formatter for the whole app, built once rather than per table row.
- **`k-settings-section`** — the titled block every settings page stacks.
- **[`share/style/scss/form.scss`](../../share/style/scss/form.scss)** — `.k-page-scroll`, `.k-field`, `.k-facts`, `.k-pref-row`, and the report toolbar/table rules.
- Shared cell classes in [`list.scss`](../../share/style/scss/list.scss): `.k-person-cell`, `.k-list-count`, `.k-list-filter`, `.k-numeric`, `.k-amount`, `.k-cell-strong`, `.k-negative`.

## Fixes made along the way

- **The list/grid toggle appeared on every non-dashboard page**, including settings and reports, where it did nothing. It is now declared per route with `data: { layouts: true }` and only the three People pages set it — the answer lives next to the page rather than in a list of paths that would drift. The first attempt read the injected `ActivatedRoute`, which crashed the whole shell because a child route's `snapshot` is not populated during construction; it now walks `router.routerState.snapshot.root`.
- **The student mock data had exactly one student per class**, which made the Attendance roster look broken. Expanded to 34 students, with Grade 1-A/1-B/2-A carrying realistic rosters.
- **Only one branch was seeded**, leaving both the topbar selector and Settings › Branches empty-looking. `BranchContextService` now seeds five. Both screens read that one list, since 62-branches.md says the selected branch is global.

## Deliberate decisions

- **Reference-data lists have no card view.** Programs, Levels, Subjects, Rooms, Fees and the rest render the table directly rather than through `p-dataview`; a card of a subject code carries nothing a row does not. Only People and Classes offer both.
- **Status enums each get their own severity mapping.** `k-status-tag` handles the generic active/inactive `Status` only. `AcademicYearStatus`, `PaymentStatus` and `ExpenseStatus` map to `p-tag` severities on their own components, because collapsing them would lose meaning.
- **`/finance/reports` and `/reports/financial` are not duplicates.** The first is the finance module's month-by-month ledger; the second is collection performance by fee category. The navigation puts "Financial Reports" in two places, so each answers a different question.
- **Default roles cannot be edited or deleted** (64-users-and-roles.md), so those rows pass `[actions]="['view']"` to `k-row-actions`. The primary action is **Invite User**, never "Add User" — the spec is explicit.
- **Every "Add" and edit action now opens a dialog form**; Export, Import and the bulk actions are still UI-only.

## Known gaps

- [ ] **Delete flows.** Create and edit are wired; the trash action on every row still does nothing, and a destructive action wants its own confirmation copy.
- [ ] **Detail pages** — `student-details` is still an empty stub; the view action on every row has nowhere to go.
- [ ] **The permission checkbox-tree editor** described in 64-users-and-roles.md. The Roles tab lists roles and their permission counts; editing them belongs to the create/edit pass.
- [ ] **All data is mock.** Every service is a signal over a seeded array; nothing talks to `school-management-webapi`.
- [ ] **Academic Settings does not yet drive anything.** 63-academic-settings.md asks that disabling a concept hide it; the toggles are currently local state only, so switching Programs off does not remove the Programs page from the nav.
- [ ] **Pre-existing build failure:** the initial bundle is 1.26 MB against a 1 MB budget. This predates this work — it failed identically with the dashboard stubbed out — but it does mean `ng build` exits non-zero. Worth raising the budget or code-splitting `KShareModule` separately.
- [ ] `dashboard.component.scss` is 5.33 kB against the 4 kB warning (error is 8 kB). Extracting the stat tile into its own component would fix it.

## Record forms (create / edit)

Sixteen dialog forms, one per entity: Students, Teachers, Parents, Programs,
Levels, Subjects, Rooms, Classes, Academic Years, Fees, Payments, Expenses,
Assessments, Branches, Users and Roles.

### How one is built

| Piece | Where | What it does |
| --- | --- | --- |
| `k-form-dialog` | [`share/components/form-dialog`](../../share/components/form-dialog) | The modal shell: title, scrolling body, fixed Cancel / Save footer. Owns no form. |
| `k-form-field` | [`share/components/form-field`](../../share/components/form-field) | Label, required asterisk and the projected control. States problems in colour only. |
| `k-form-error-dialog` | [`share/components/form-error-dialog`](../../share/components/form-error-dialog) | The single `p-confirmDialog`, mounted once in the layout, that lists what is wrong. |
| `FormValidationService` | [`share/forms`](../../share/forms) | `check(form, labels)` — the gate at the top of every save handler. |
| `upsertById` / `removeById` | [`core/utils/collection.ts`](../../core/utils/collection.ts) | The one place a mock service's save rule is written down. |

A page keeps the list and the dialog state (`formVisible`, `editing`); the form
component keeps the draft. Nothing reaches the service until a valid save, so a
cancelled edit leaves no trace.

### Deliberate decisions

- **Problems are stated once, in a dialog — never under the inputs.** A field
  that is unhappy turns its label and its border red and says nothing more; the
  confirm dialog lists every problem together. Printing a line of red under each
  input made a seven-field form grow by half its height the moment it was wrong.
- **The alert is shaped like the form it interrupts.** It reuses the
  `k-form-dialog-head` / `-title` / `-sub` markup and shares the header, content
  and footer rules by selector, so the padding, the rules between sections, the
  type and the button height are the same object rather than a copy that drifts.
  It does not wear `.k-form-dialog` itself, so that class still identifies
  exactly one node in the DOM.
- **The red is carried by the icon and the list markers, not the prose.** Title
  and messages stay in normal ink — the fields behind the dialog are already
  red, and a second block of red text made the alert shout. The dismiss button
  is outlined secondary for the same reason: there is nothing to confirm.
- **The asterisk runs one step ahead of the label.** It is red from the moment a
  field is required and drops to muted ink as soon as it has a value, without
  waiting for a save to be attempted — so a half-filled form shows at a glance
  what is left. The label only turns red once the field has been used or a save
  was tried, because a form nobody has typed in yet is not yet wrong.
- **Labels live in one object per form.** `labels` feeds both the template and
  the message list, so a renamed field cannot end up described by its old name.
- **A validator can carry its own sentence.** Returning `{ message: '...' }`
  puts that text straight in the list, which is how the uniqueness checks on
  admission numbers, employee numbers, codes, references and emails explain
  themselves without teaching the generic message table about them.
- **Identity fields are checked for duplicates**, because every service saves by
  id: an admission number typed twice would overwrite a student rather than add
  one.
- **Opening resets the draft, not closing.** Clearing on the way out flashes
  empty fields through the hide animation.
- **`--k-bad` is a token, not a literal.** Dark mode takes a lighter red because
  `#c2312f` measures 3.28:1 on the dark panel, under the 4.5 body text needs.
  Both modes now measure 5.56 and 6.45 for the label, 10.35 and 17.85 for the
  message list.

### Still out of scope here

- Enrolment counts, average scores and "graded" are consequences of other work,
  so the Class and Assessment forms leave them alone rather than inviting a
  number to be typed in.
- Terms are managed on the Academic Year's own page; editing a year here leaves
  its terms untouched.
- The permission editor is still a module picker: a custom role gets all four
  actions on every module it is given. The checkbox tree in 64-users-and-roles.md
  is a separate piece of work.

## Quick Add and the layout shell

The `+` in the breadcrumb bar opens a grouped menu of all sixteen record forms,
and every one of them has an `Alt+<letter>` shortcut that opens it directly from
anywhere in the app. `Ctrl+K` opens the menu itself.

### How it reaches a form

A form belongs to its page — that is where the options it needs come from — so
[`QuickAddService`](../../core/services/quick-add.service.ts) owns no dialog. It
routes to the page and leaves a request behind; the page picks the request up
and opens its own form through `openOnQuickAdd(id, open)`, one line in each page
constructor. Being already on the page takes the same path, because it is the
request that opens the form, not the navigation.

### Deliberate decisions

- **`Alt+<letter>` opens a form from anywhere**, without the menu. The menu
  itself is `Ctrl+K`, and a bare letter works while it is open, where there is
  no text input for the keystroke to mean anything else.
- **Alt rather than a bare letter or Shift.** A bare letter — and Shift plus a
  letter, which is only a capital — would fire from inside every search box and
  filter on the app. Alt is not a character, so the shortcuts stay live while
  someone is typing, and the handler does not have to stand down there.
- **Two of the letters are browser menu accelerators** on Windows (`Alt+F`,
  `Alt+E` open Chrome's menu). Claiming the event with `preventDefault` is what
  keeps those shut. Verified that the app fires correctly; the browser's own
  menu cannot be observed under automation, so that part rests on the standard
  behaviour of `preventDefault`.
- **The physical key, not the character.** On macOS Alt composes — `Alt+S`
  arrives as `ß` — so matching `event.key` would leave every shortcut dead
  there. `event.code` is read first, with `event.key` as the fallback.
- **`Ctrl+K` does nothing while a form is open.** A second panel over a dialog
  is only in the way, so the handler checks for an open dialog mask first.
- **Quick-adding a Role brings the Roles tab forward**, because saving into a
  list the reader cannot see looks like nothing happened.

### Shell fixes made at the same time

- **The breadcrumb bar held two heights.** It measured 45px on most routes and
  47px on the three that offer the list/grid toggle, so the page below shifted
  two pixels on every navigation between them. The bar now has a set height and
  the icon-only toggle is trimmed to fit it: one height, 45px, on every route.
- **No crumb was distinguishable from any other.** PrimeNG renders every item
  disabled, since the ancestors are navigation groups rather than pages, and the
  page's own name was the same muted grey as its parent's. The last crumb now
  takes solid ink and weight.
- **The inset edge on the content canvas was invisible in dark mode** — black at
  12% over a near-black canvas. `--k-shell-shadow-color` is now a themed token
  that comes from the light end under `.app-dark`.
- **The old Quick Add button did nothing.** It had a tooltip and no behaviour,
  and it only appeared on routes without the layout toggle. It is now real, and
  it is on every route.
