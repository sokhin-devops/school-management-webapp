# TODO — Public Website

Spec: [`../plains/01-public-website.md`](../plains/01-public-website.md)
Context: [`../plains/00-product-overview.md`](../plains/00-product-overview.md)

Stack: Angular 19 (standalone components) + PrimeNG v19 (Material preset, already configured in `app.config.ts`) + PrimeFlex utility classes. Built with no custom SCSS — every section uses PrimeFlex utilities only.

Status: **Implemented.** Root route (`/`) renders `PublicWebsiteComponent`. Verified with `ng build` (production) and a browser check (desktop 1440px + mobile 390px, no console errors).

## Implementation notes (deviations from the original plan)

- No separate `PublicLayoutComponent`/router-outlet — this is a single scrolling page (nav items are same-page anchors: `#hero`, `#features`, `#pricing`, `#value-statement` for About, `#faq`), so `PublicWebsiteComponent` composes Navbar + sections + Footer directly.
- Academic Management, People Management, Attendance, Finance, and Reports (5 near-identical marketing rows: icon + heading + description + bullet points, alternating sides) are one reusable `CapabilityShowcaseComponent` (`features/public-website/components/capability-showcase/`) driven by an `@Input() data`, instead of 5 separate components.
- `angular.json` production budgets raised (initial: 500kB/1MB → 2MB/4MB warning/error) — the default CLI scaffold budget doesn't fit this project's shared "kitchen-sink" `KShareModule` pattern (imports ~30 PrimeNG modules eagerly); this was already close to the ceiling before this feature.
- Added `AccordionModule` and `TagModule` to `KShareModule` (used by FAQ and School Types/Pricing "Most Popular" tag).
- Hover/animation polish uses PrimeFlex utilities only (`transition-all`/`transition-colors` + `transition-duration-*` + `hover:shadow-*`/`hover:text-primary`, plus `fadeindown`/`fadeinup`/`fadein` + `animation-duration-*`/`animation-delay-*`): navbar entrance + logo hover, hero content/icon-panel entrance and hover, feature cards, how-it-works step badges, school-type tags, capability-showcase icon panels, pricing cards, and footer links. This PrimeFlex version has no `scale`/`translate` transform utilities, so lift effects use `shadow-*` elevation, not scale-up. Entrance animations were only applied to above-the-fold content (navbar + hero) — PrimeFlex animations aren't scroll-triggered, so applying them to below-the-fold sections would finish playing before the user ever scrolls to them; a real scroll-reveal would need JS (`IntersectionObserver`), which is out of scope for a PrimeFlex-only pass.

## File layout

```
features/public-website/
  public-website.component.ts/html        — page shell, assembles everything, owns route ''
  components/
    navbar/                                — p-menubar: #start (logo), items, #end (Login/Sign Up)
    footer/                                — Product/Company/Legal columns
    capability-showcase/                   — reusable alternating icon+copy+bullets row
  sections/
    hero/, value-statement/, features/, how-it-works/, school-types/,
    pricing/, faq/, final-cta/
```

## 0. Setup & Architecture

- [x] Create `src/app/features/public-website/` with standalone components.
- [x] Wire root route in `app.routes.ts` to `PublicWebsiteComponent`; `app.component.html` now just renders `<router-outlet>`.
- [x] Add `AccordionModule` (FAQ) and `TagModule` (school type badges, "Most Popular" pricing tag) to `KShareModule`.
- [x] Confirmed Material preset + PrimeFlex utilities are sufficient — no custom component SCSS was needed.

## 1. Navbar

- [x] `<p-menubar>` with `#start` (logo + "SchoolSuite"), `items` (Home, Features, Pricing, About, FAQ as same-page anchors), `#end` (Login text-button, Sign Up Now filled button).
- [x] Both CTAs are UI-only (no routing yet).
- [x] PrimeNG's built-in mobile collapse verified in-browser at 390px width.

## 2. Hero

- [x] Headline + subheadline stating what the product is, who it serves, the benefit.
- [x] Primary CTA `SIGN UP NOW`, secondary CTA `LOGIN`.
- [x] Responsive two-zone layout (copy + icon panel) via PrimeFlex grid.

## 3. Value Statement

- [x] "One platform, not a separate app for every school" — reinforces common-core pitch. Doubles as the nav's "About" anchor target.

## 4. Features

- [x] 12-item responsive grid (icon + label), one card per feature from the spec list.

## 5. How It Works

- [x] 4-step sequence (01–04) in a responsive grid, numbered circular badges.

## 6. School Types

- [x] All 7 types shown as tags, with the "one platform for different types" message.

## 7–11. Academic Management / People Management / Attendance / Finance / Reports

- [x] Built as 5 instances of the shared `CapabilityShowcaseComponent`, alternating image/text side, each with an eyebrow label, heading, description, and 3 bullet points.

## 12. Pricing

- [x] Starter / Professional (highlighted, "Most Popular") / Enterprise cards, each with price, feature list, limits, and a `SIGN UP NOW` CTA.

## 13. FAQ

- [x] `<p-accordion>` (new panel/header/content API) with 8 questions covering school types, branches, academic customization, users/roles, finance, plans, responsiveness, permissions. First panel open by default.

## 14. Final CTA

- [x] Closing conversion section on a primary-colored background repeating `SIGN UP NOW` / `LOGIN`.

## 15. Footer

- [x] Product / Company / Legal columns (Features/Pricing, About/FAQ/Contact, Privacy Policy/Terms of Service).

## Cross-cutting

- [x] CTA buttons are UI-only — no `routerLink`/href — per spec note "the url will add later".
- [x] Responsive behavior checked at 1440px and 390px in-browser.
- [x] Semantic heading levels per section (`h1` in hero, `h2` per section, `h3` for card/step titles).
- [x] No custom SCSS added — PrimeFlex utilities only, plus one small global addition (`scroll-behavior: smooth` and a `.section-anchor { scroll-margin-top }` utility in `styles.scss` so anchor jumps land below the sticky navbar).

## Out of scope (belongs to other docs)

- Real routing to Sign Up / Login flows → `02-authentication.md`, `03-signup-and-onboarding.md`.
- Any authenticated System Web App layout/nav → `04-system-layout.md`, `05-sidebar-navigation.md`, `06-topbar.md`.
