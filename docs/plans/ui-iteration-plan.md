# UI Iteration Plan

## Context

Playwright desktop screenshots exposed a clear mismatch between the app's current layout and the amount of data now available after meal slots, categories, and seeded meals expanded.

The product is still intended to feel fast, practical, and low-stress for family meal planning. The current UI is functional, but several screens now feel busy because mobile-first stacked cards are being used unchanged on desktop.

Primary observed issues:

- Desktop screens leave large unused areas while dense workflows stack vertically in narrow columns.
- Meal editing is unintuitive: clicking `Edit` changes the form at the top of the page, requiring the user to scroll away from the meal they were viewing.
- Settings has become one long maintenance page containing meal slots, categories, store tags, and the full icon library.
- The icon library consumes too much visual space for something that is reference/browsing support.
- Planning shows every day and slot as tall repeated cards, creating heavy scrolling.

## Design Direction

Use desktop width for the primary browsing/listing surface, and move creation/editing into focused modal dialogs.

This is preferable to a persistent left-list/right-editor layout because the app already has several dense records with rich forms. Keeping a permanent editor panel visible would preserve the "busy admin screen" feeling. Modal editors let the user focus on one edit task, then return to the list exactly where they started.

Guiding principles:

- Full-width list or table surfaces for browsing, scanning, and filtering.
- Modal dialogs for add/edit flows on both desktop and mobile.
- Inline destructive or high-impact actions should be explicit and confirmed.
- Keep dense reference management behind tabs or separate screens.
- Reduce nested cards and repeated controls.
- Keep the main app header compact on internal tool screens.
- Preserve mobile touch ergonomics while giving desktop its own layout.

## Proposed Work Batches

### 1. App Shell And Desktop Layout

Goals:

- Reduce the oversized internal header on desktop.
- Use more viewport width for work surfaces.
- Keep bottom navigation for mobile, but switch to a compact desktop navigation treatment.

Candidate changes:

- Add responsive shell styles for desktop.
- Replace the large hero-like title with a compact app bar on desktop.
- Move primary navigation to a top or side desktop nav.
- Keep current bottom nav under tablet/mobile breakpoints.

Success criteria:

- Desktop screenshots show the primary workflow near the top of the page.
- The app no longer feels like a landing page wrapped around admin tools.

### 2. Meal Management Modal Editing

Goals:

- Make editing meals obvious and local to the selected record.
- Let the meal list use the full width.
- Remove the need to scroll to the top after clicking `Edit`.

Candidate changes:

- Replace always-visible add/edit form with an `Add meal` button.
- Open add/edit in a modal dialog.
- Keep filters above the meal list as a compact toolbar.
- Use a wider responsive meal grid/list for desktop.
- Return focus to the originating button when the modal closes.

Success criteria:

- Clicking `Edit` opens an editor immediately.
- Closing the modal returns the user to the same place in the list.
- Meal browsing and filtering use the full desktop width.

### 3. Settings Information Architecture

Goals:

- Turn Settings from a long mixed maintenance page into focused sections.
- Remove the icon library from the default settings maintenance flow.

Candidate changes:

- Add Settings tabs or segmented navigation:
  - Meal slots
  - Categories
  - Store tags
- Move add/edit for slots, categories, and store tags into modal dialogs.
- Show categories and slots as compact full-width lists/tables.
- Move Icon Library to its own screen or its own Settings subtab.

Success criteria:

- Managing meal slots does not require scrolling past categories or icons.
- Category assignment is still easy, but each edit is focused.
- Icon browsing no longer dominates Settings.

### 4. Icon Library Separation

Goals:

- Preserve icon browsing while making it feel optional and searchable.

Candidate changes:

- Add a dedicated `/icons` route or Settings subtab.
- Add icon search/filter controls.
- Show icon name, ID, AI-generated flag, and confidence.
- Later: show whether an icon is currently assigned to any category.

Success criteria:

- Settings is usable without scrolling through the full icon grid.
- Icon Library remains available when assigning or auditing icons.

### 5. Planner Desktop Grid

Goals:

- Reduce vertical scrolling in the weekly planner.
- Make Breakfast/Lunch/Dinner planning scannable as a week.

Candidate changes:

- Use a desktop grid with days as rows and enabled meal slots as columns.
- Keep mobile as stacked day/slot cards.
- Compact each cell to show selected category and meal.
- Open detailed category/meal picking in a modal or popover from the cell.
- Keep preview/rule feedback in a collapsible panel or sidebar.

Success criteria:

- A full week is much more visible at desktop size.
- Parents can scan gaps quickly.
- Editing a cell is focused and does not require scrolling through repeated controls.

## Suggested First Implementation Slice

1. Refactor `AppShell` desktop layout.
2. Convert Meal add/edit to modal dialogs.
3. Use Playwright screenshots to compare before/after.

This slice directly addresses the most painful interaction issue while creating responsive layout patterns that Settings and Planner can reuse.

## Validation

Use:

```bash
npm run build -w frontend
npm test -w frontend
npm run test:e2e -w frontend
```

Manual review targets:

- Desktop `Meals` screenshot after modal refactor.
- Desktop `Settings` screenshot after sectioning.
- Desktop `Plan` screenshot after grid exploration.
- Mobile spot checks for modal usability and bottom navigation.
