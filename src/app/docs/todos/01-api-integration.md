# API Integration

The web app reads and writes through `school-management-webapi` rather than the
seeded arrays it grew up on.

## How a screen gets its data

Three layers, and each list page touches only the first.

| Piece | Where | What it does |
| --- | --- | --- |
| `ApiClientService` | [`core/services`](../../core/services/api-client.service.ts) | Resolves paths against `environment.apiUrl` and unwraps the response |
| `createBranchResource` | [`core/api`](../../core/api/branch-resource.ts) | A collection for one branch: `items`, `loading`, `loaded`, `error`, `reload`, plus create/update/remove |
| `createTenantResource` | [`core/api`](../../core/api/tenant-resource.ts) | The same, for lists that belong to the tenant rather than a branch |

A service maps between the two vocabularies and exposes one `save()`; a page
binds `k-list-shell` to `loading` and `error` and is otherwise unchanged.

## Loading

- **Lists show `p-skeleton`** ([`k-list-skeleton`](../../share/components/list-skeleton)),
  shaped like the rows they stand in for, with the column widths taken from the
  page's own `<th>` tags. First load only: a reload leaves the rows alone,
  because replacing a list someone is reading with grey bars looks like it was
  emptied.
- **The whole app shows a circular indicator**
  ([`k-app-loader`](../../share/components/app-loader)) for the one wait that
  stops everything: loading the branches that scope every other request. Drawn
  rather than `p-progressspinner`, which cycles through four hues that do not
  belong in a single-accent theme.

## Deliberate decisions

- **The API client tolerates both response shapes.** Auth, onboarding, schools,
  branches, academic years, plans and subscriptions wrap their body in
  `{success, data}`; students and every module added after them return the DTO
  directly. Recognised in one place rather than by each caller. Worth settling
  on the API side — this is the seam, not the fix.
- **Branch-scoped lists fetch one generous page and filter client-side**, because
  the screens search, sort and page across the whole set. Moving to server-side
  paging is a change to every list page, not to one constant.
- **Names are resolved on the page, not in the service.** The API stores ids;
  the tables show names. The page is what already holds the other lists.
- **Tenant resources load on first read**, not from a page constructor. A
  constructor that starts a fetch has to be remembered by every page that
  borrows the list, and forgetting leaves a blank table with no error.
- **The branch is chosen once and remembered per device.** Every other request
  is scoped by it, so an invented id would make every list empty and every save
  fail.

## Fixed along the way

- **Every form invented its own id** (`prg-rob`, `lvl-<timestamp>`), so against a
  real server each *create* was sent as a PUT to a record that never existed.
  Removed across all sixteen forms; the server assigns ids.
- **Branches were seeded locally**, which would have 404'd every branch-scoped
  call. `BranchContextService` now loads them.
- **The Roles tab crashed the browser.** `[actions]="role.isDefault ? ['view'] : [...]"`
  built a new array on every change detection, and `actions` is a signal input —
  so the row never settled, change detection never stopped and the tab ran out
  of memory. Held as two fixed arrays now.
- **`describeFailure` sat in `branch-resource`**, which `BranchContextService`
  imported while `branch-resource` imported it back. Moved to
  [`api-failure.ts`](../../core/api/api-failure.ts) to break the cycle.
- **`SchoolType` did not match the web app's list** (the API had five of the nine
  the UI offers). Aligned, with the migration recorded in the API's own docs.
- **CORS allowed exactly one origin.** Now `app.cors.allowed-origins`, because
  the dev server, a preview build and the deployed site are three different
  origins.

## Known gaps

- [x] **Reports** now come from `/api/v1/reports/{enrolment,attendance,academic,
  financial}`; `report.service.ts` reads them rather than its own seed.
- [x] **Billing details and invoices are real.** The API raises an invoice per
  subscription period (`SubscriptionBillingService`, renewed nightly), and serves
  `/subscriptions/current/usage`, `/subscriptions/invoices` and `/subscriptions/billing`.
  No payment processor is connected, so invoices are issued, not collected.
- [x] **Permissions are enforced.** See below.
- [x] **`branch-mock.service.ts`** deleted.
- [x] **The student form** asks for gender, date of birth and admission date.
- [x] **The production build passes its budget.** It was lazy-loading that never
  happened: the app shell imported the loader through the share barrel, pulling
  every shared component into the initial chunk. Now 1.29 MB against a 1.4 MB
  warning / 1.6 MB error budget.
- [x] **The Users & Roles freeze was an app bug, not HMR.** `FloatingScrollDirective`
  kept rescanning a tab panel that had been detached from the page, and its own
  MutationObserver re-triggered it forever. It now ignores a detached host and
  its own scrollbar thumbs.


## Permissions

The grid is read on the way in and enforced on the way out.

**Server.** `PermissionInterceptor` runs on `/api/v1/**` and refuses with 403
before the controller is reached. It works out the module from the path and the
action from the HTTP method (`ModulePermissions`), rather than from an
annotation on each controller: twenty controllers annotated by hand is twenty
chances to forget one, and a forgotten annotation is an unguarded endpoint.
Adding a module means adding a line to `MODULE_BY_RESOURCE`.

Three things are never refused, each deliberately:

- the **owner** of a tenant, who must stay able to repair a grid that locks
  everyone else out;
- a member with **no `roleId`**, which is every account created before roles
  existed. Refusing them would have locked those schools out of their own data
  on the day this shipped. Assigning a role is what turns the grid on;
- **reads of the school and its branches.** The branch switcher sits in the
  topbar of every page, and every other record is scoped to a branch. Withholding
  them from a teacher would leave them unable to say which branch their own class
  list is for. Changing them is still Settings — only the reading is let through.

Paths outside the map — auth, plans, subscriptions, onboarding, the dashboard —
are reachable by anyone signed in.

**Client.** `PermissionService` reads `GET /api/v1/auth/me/permissions` once per
session and clears it on sign-out. It feeds:

- `permissionGuard`, wired as `canActivateChild` on the authenticated layout, so
  a module a role cannot view is unreachable by URL as well as by menu;
- the **sidebar**, which drops what cannot be viewed and drops a group whose
  children have all gone;
- `k-row-actions`, which filters view / edit / delete against the route's module,
  so no page has to remember to ask;
- `*kCan="'create'"`, on the fourteen Add buttons.

The guard *waits* for the grid rather than letting the first navigation through.
On a full page load it runs before the request could possibly have returned, and
a guard that passes whenever it is asked early is no guard at all — the first
version of this did exactly that, and typing `/finance/fees` walked straight in.
The wait costs one request, once per session.

Everything else stays permissive until the grid arrives, and if it cannot be
read at all. Hiding every control for the moment it takes to load would flash an
empty sidebar at every user on every sign-in, to spare an unauthorised one a
button the server would refuse anyway. Hiding a control removes a mistake, not an
attack; the server is the guard.

**Verified** against a live API and the running app. Server: 17/17 — an owner is
unrestricted; a member holding a Students-view-only role reads students (200),
is refused creating one (403) and reading fees, teachers, roles and reports
(403), reads branches and schools (200) but cannot create a branch (403), and
keeps the dashboard and `/auth/me`. App: 13/13, no console errors — that member
sees only People in the sidebar, gets no Add Student button, and is bounced from
`/finance/fees` to the dashboard, while the owner reaches all four sections and
is offered every Add button.
