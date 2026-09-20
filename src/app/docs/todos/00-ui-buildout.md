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
- **Every "Add"/"Save"/"Export" button is UI-only.** No create, edit, delete or persistence flow is wired, because no spec covers those forms yet.

## Known gaps

- [ ] **Create / edit / delete flows** for every entity — the modals and forms behind the action buttons. Needs a spec first.
- [ ] **Detail pages** — `student-details`, `student-from`, `teacher-form`, `parent-from` are still the original empty stubs.
- [ ] **The permission checkbox-tree editor** described in 64-users-and-roles.md. The Roles tab lists roles and their permission counts; editing them belongs to the create/edit pass.
- [ ] **All data is mock.** Every service is a signal over a seeded array; nothing talks to `school-management-webapi`.
- [ ] **Academic Settings does not yet drive anything.** 63-academic-settings.md asks that disabling a concept hide it; the toggles are currently local state only, so switching Programs off does not remove the Programs page from the nav.
- [ ] **Pre-existing build failure:** the initial bundle is 1.26 MB against a 1 MB budget. This predates this work — it failed identically with the dashboard stubbed out — but it does mean `ng build` exits non-zero. Worth raising the budget or code-splitting `KShareModule` separately.
- [ ] `dashboard.component.scss` is 5.33 kB against the 4 kB warning (error is 8 kB). Extracting the stat tile into its own component would fix it.
