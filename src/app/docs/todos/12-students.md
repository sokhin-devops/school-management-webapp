# TODO — Students

Spec: [`../plains/12-students.md`](../plains/12-students.md)
Context: [`../plains/11-people.md`](../plains/11-people.md), [`../plains/05-sidebar-navigation.md`](../plains/05-sidebar-navigation.md)

Stack: Angular 19 (standalone, signals) + PrimeNG v19 (`p-dataview`, `p-table`, `p-paginator`) + PrimeFlex.

Status: **Implemented.** Route `/people/students` renders `StudentComponent`. Verified with `ng build` (production) and a headless-browser pass covering light/dark, 1600px and 430px, both layouts, sorting, both filters, search, the empty state, and the clear-filters path — no console errors.

Students is the first page of the navigation to get its final UI, and the pass deliberately produced a **shared list-page kit** rather than a one-off screen. Teachers, Parents, and every later list (Classes, Subjects, Fees …) are meant to be assembled from the same pieces.

## The shared kit

`share/components/` — import from the barrel, `share/components/index.ts`. None of these pull in `KShareModule`; each imports only the PrimeNG modules it actually needs, so a page that uses one does not drag the whole PrimeNG surface into its chunk.

| Component | Selector | What it owns |
|---|---|---|
| `ListShellComponent` | `k-list-shell` | The page frame: fixed toolbar, one scrolling pane, pinned footer. Slots: `[k-toolbar]`, default, `[k-footer]`. |
| `ListToolbarComponent` | `k-list-toolbar` | Search box (a `model()`, bound with `[(search)]`) plus `[k-filters]` and `[k-actions]` slots. |
| `EmptyStateComponent` | `k-empty-state` | Icon, title, message, projected action. |
| `StatusTagComponent` | `k-status-tag` | The single place `Status` is turned into a label and a severity. |
| `RowActionsComponent` | `k-row-actions` | The view / edit / delete trio; `actions` input drops any of them. |
| `PersonCardComponent` | `k-person-card` | Grid-view card for anyone in People; caller supplies the `meta` lines and projects the footer. |

`share/style/scss/list.scss` — global, because PrimeNG's DataView and Table render with `ViewEncapsulation.None` and a component-scoped selector never reaches `.p-dataview-content` or `.p-datatable-tbody`. Keyed on `.k-dataview`, `.k-table`, `.k-table-wrap`, `.k-grid-scroll`, so only a list that opts in is affected.

The table runs in PrimeNG's own flex-scroll mode — `[scrollable]` plus `scrollHeight="flex"` — which keeps the header and the body in **one** table. With `table-layout: fixed`, the width declared on a `th` then governs its whole column, body cells included, so a page declares each column's width once, in the markup, and alignment holds by construction rather than by the author keeping two lists in sync. The header is made sticky here (PrimeNG gives it `top` and a z-index but leaves `position` alone) and carries a `--p-content-hover-background` tint — which a sticky header needs anyway, since a transparent one lets rows scroll through underneath it. The table also has a `min-width: 54rem` floor, so a six-column table on a phone scrolls sideways instead of compressing every cell into a four-line sliver.

A page now looks like this:

```html
<k-list-shell>
  <k-list-toolbar k-toolbar [search]="search()" (searchChange)="onSearch($event)">
    <ng-container k-filters>…</ng-container>
    <ng-container k-actions>…</ng-container>
  </k-list-toolbar>
  <p-dataview class="k-dataview" …>…</p-dataview>
  <p-paginator k-footer … />
</k-list-shell>
```

## Bugs found and fixed in this pass

- **The Class and Status filters did nothing.** Both signals existed and both selects were bound, but the `computed` that produced the list only ever applied the search term. Filtering now applies all three.
- **The empty template never rendered.** `p-dataview` looks for `#emptymessage`; the page declared `#empty`, which silently renders nothing — an empty result just showed a blank pane. (The container class is `p-dataview-emptymessage`, not `p-dataview-empty-message`.)
- **Status showed the raw enum** — a lowercase `active` / `inactive` straight out of the model. `k-status-tag` now renders `Active` / `Inactive`.
- **The table header and body columns did not line up.** The first cut split `thead` and `tbody` into two separate fixed-layout tables so the tbody could be the only scroller. Only the `th`s carried width percentages, so the body table had nothing to go on and divided itself into six equal columns: measured in the browser, every `td` came out at exactly 217px (1300 / 6) while its header ranged from 130px to 390px, putting columns up to **171px** away from their own heading. The scrollbar-gutter `padding-right` on the thead also left the header row 8px narrower than the body rows whenever there was no scrollbar. Both are gone with the single-table approach above — re-measured drift is 0px on all six columns, and the two row widths match exactly.
- **Body cells rendered at the browser default 16px** while the student-name cell was 13px, so the two halves looked like different tables. Header and body cells now share padding, vertical alignment and type scale; only weight, case and colour mark the header out.

## Deliberate design decisions

- **Inactive is neutral, not red.** Inactive is a state a record is allowed to be in, not a failure; spending the danger colour on it leaves nothing louder for things that are actually wrong. `severity="secondary"`.
- **Sorting lives in the component, not in `p-table`.** Paging is external (`p-paginator` in the shell footer), so letting the table sort would only reorder the twelve rows already on screen. The table runs with `[customSort]="true"` and reports the clicked column through `(sortFunction)`; the component holds `sortField`/`sortOrder` signals and sorts the whole filtered list. Setting a signal to the value it already holds is a no-op, which is what stops the new page flowing back into `[value]` and cycling.
- **Students sort by surname**, not by given name — a roster ordered by first name is not a roster anyone reads.
- **Row actions sit at 0.55 opacity and come up to full on hover or focus**, so a long table reads as data rather than as a wall of buttons. They are never dimmed under `@media (hover: none)`, where there is no hover to reveal them.
- **The layout toggle stays in the global breadcrumb bar** (`LayoutUiService`), as before — the page just reads `layoutUi.layout()`.
- Action buttons remain UI-only per the spec note ("just only small p-button icon UI no need method"). `RowActionsComponent` emits `view` / `edit` / `remove`; `StudentCardComponent` re-emits them with the record. Nothing is wired to a handler yet.

## File layout

```
share/components/
  index.ts                            — barrel for the kit
  list-shell/ list-toolbar/ empty-state/ status-tag/ row-actions/ person-card/
share/style/scss/list.scss            — DataView + Table scroll layout (global)
features/people/student/
  student.component.ts/html/scss      — filters, sorting, paging; assembles the kit
  student-card/                       — thin student adapter over k-person-card
  student-details/, student-from/     — still stubs, out of scope for this pass
core/services/student.service.ts      — StudentRecord mock data (signal-backed)
```

## Verified by measurement

Column geometry was read out of the live page rather than eyeballed — `th` versus `td` left edge, width, padding, `text-align`, `vertical-align` and font, for all six columns, before and after the fix. Sticky behaviour was checked by scrolling the container 400px and confirming the header's `y` was unchanged and that `elementFromPoint` at the header's position still returned a `th`, i.e. the background is opaque and no row bleeds through.

## Next, in navigation order

- [ ] **Teachers** (`13-teachers.md`) — `TeacherService` mock + `teacher-card` over `k-person-card`; meta lines become employee number and subjects.
- [ ] **Parents** (`14-parents.md`) — same shape; meta lines become linked children.
- [ ] Student detail and create/edit form (`student-details`, `student-from`) — needs a spec for the modal/detail flow first.
- [ ] Academic lists (Programs, Levels, Classes, Subjects, Rooms) — the kit should carry over unchanged; anything it cannot express is a gap in the kit, not a reason to fork a page.

## Out of scope

- Real Add/Edit/Delete/View behaviour — no spec yet for the modal/detail flow.
- Live data — `StudentService` is mock-only, no backend wiring.
- `classId` resolution against a real `ClassGroup` list — `className` is still denormalized onto the mock record.
