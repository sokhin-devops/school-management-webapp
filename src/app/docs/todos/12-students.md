# TODO — Students

Spec: [`../plains/12-students.md`](../plains/12-students.md)
Context: [`../plains/11-people.md`](../plains/11-people.md)

Stack: Angular 19 (standalone components) + PrimeNG v19 (`p-dataview`, `p-table`, `p-card`) + PrimeFlex.

Status: **Implemented.** Route `/people/students` renders `StudentComponent`. Verified with `ng build` (development) and a headless-browser pass (1440px) covering: card view, table view via the global layout toggle, live search filtering, and paginator — no console errors.

## Implementation notes (deviations from the original plan)

- The page-level header only owns Search + "Add Student" — the list/grid layout toggle already lives in the global breadcrumb bar (`LayoutComponent` / `LayoutUiService`, see [`04-system-layout.md`](../plains/04-system-layout.md)), so `StudentComponent` just reads `layoutUi.layout()` and binds it straight to `p-dataview`'s `[layout]` input (`DataViewLayout` is already `'list' | 'grid'`, a 1:1 match).
- Search has no plan-mandated behavior beyond "Search" in the header, so it was wired to actually filter (name, admission number, class) via a `computed()` over the mock list — an inert search box would look broken.
- Action buttons (view/edit/delete) are icon-only `p-button`s with no click handlers, per the plan note "just only small p-button icon UI no need method." `student-details` and `student-from` (already-scaffolded stub components) are not wired up — they belong to a future edit/view-modal pass.
- `p-dataview`'s `#list`/`#grid` content-template API (Angular template-ref-variable `ContentChild`) is separate from `p-table`'s legacy `pTemplate="header"`/`pTemplate="body"` directive API — both had to be used correctly in the same page. `SharedModule` (from `primeng/api`, exporting the `pTemplate` directive) was added to `KShareModule` since nothing in the app had used `p-table` templates yet.
- Student mock data lives in `StudentService` as a `StudentRecord` (`Person` + a denormalized `className` display field), built on the existing shared `Person`/`PersonType`/`Status` models from `11-people.md` rather than a one-off Student-only shape.
- Table view wraps `p-table` in an `overflow-x-auto` div for narrow-viewport horizontal scrolling instead of the deprecated `responsiveLayout="scroll"` input.

## File layout

```
features/people/student/
  student.component.ts/html/scss      — page: search + Add Student header, p-dataview (list/grid)
  student-card/                       — presentational card for grid view (avatar, class, contact, status, actions)
  student-details/, student-from/     — pre-existing stubs, out of scope for this pass
core/services/student.service.ts      — StudentRecord mock data (signal-backed)
```

## 0. Setup

- [x] Wire `people/students` in `app.routes.ts` to `StudentComponent` (was a `comingSoon` placeholder).
- [x] Add `SharedModule` (primeng/api) to `KShareModule` so `pTemplate` works for `p-table`.
- [x] `StudentService`: 16 mock `StudentRecord`s (Grade 1–8, A/B sections), 2 marked `inactive`, exposed via a readonly signal.

## 1. Header

- [x] Search input (`p-iconfield` + `p-inputicon` + `pInputText`), filters live across name / admission number / class.
- [x] Small "Add Student" `p-button` (icon + label, UI-only).

## 2. Body — p-dataview

- [x] `p-dataview` bound to the filtered list, `[layout]` driven by the existing global `LayoutUiService` toggle, `[paginator]="true"` at 8 rows/page, empty-state template.
- [x] Table view (`#list`): `p-table` with Student (avatar + name + email) / Admission No. / Class / Contact / Status (`p-tag`) / Actions columns.
- [x] Card view (`#grid`): responsive PrimeFlex grid of `app-student-card`.
- [x] Both views expose view/edit/delete as small icon-only `p-button`s (no methods wired).
- [x] `StudentCardComponent` styled with its own SCSS (hover elevation, fixed avatar size, truncated contact lines) rather than relying on default `p-card` looks.

## Out of scope (belongs to other docs / a later pass)

- Real Add/Edit/Delete/View behavior and the `student-from` / `student-details` stub components — no spec yet for the modal/detail flow.
- Live data — `StudentService` is mock-only, no backend wiring.
- Class (`classId`) resolution against a real `ClassGroup` list — `className` is currently denormalized directly onto the mock record.
