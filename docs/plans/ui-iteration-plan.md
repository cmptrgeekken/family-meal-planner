# UI Iteration Plan

## Purpose

This document defines the next UI cleanup pass for the Family Meal Planner app.
It is intentionally prescriptive. The goal is to remove ambiguity before implementation starts.

## Status

The first major cleanup pass has landed across the desktop shell, meals, settings, grocery, planner, and magnet export screens.

Implemented from this plan:

- compact desktop shell with sticky desktop navigation
- meals modal add/edit flow with full-width browsing
- settings section navigation with modal maintenance flows
- icon library moved out of the default settings maintenance view
- first desktop planner density pass with day-by-slot scanning improvements
- ongoing Playwright screenshot review for core screens

What remains is follow-up polish rather than first-pass structure work.

## Problem Statement

Playwright desktop screenshots showed that the app is now carrying significantly more content than its original mobile-first stacked layouts can comfortably support.

The main issues are now established:

- Desktop screens waste large areas of width while primary workflows remain trapped in narrow stacked columns.
- Meal editing is disorienting because `Edit` changes a form elsewhere on the page instead of opening an editor at the point of intent.
- Settings has become a long mixed-maintenance surface containing too many unrelated tasks.
- The icon library is useful, but it overwhelms Settings and should not sit inline with routine category and slot editing.
- The planner is too tall on desktop because every day and every slot repeats the same control structure in stacked cards.

## Firm Decisions

### 1. Editing Pattern

The application will use **full-width browse/list surfaces plus modal add/edit flows**.

This applies to:

- meals
- meal slots
- categories
- store tags

We are **not** using a persistent list-on-one-side and editor-on-the-other layout.

Reason:

- persistent editors keep too much UI on screen at once
- the app already has dense forms
- modal focus better matches the parent workflow of scanning a list, then editing one thing
- the same interaction model works on desktop and mobile

### 2. Desktop Shell

Internal app screens will use a **compact desktop app shell**, not a hero-style header.

Decisions:

- the large landing-style headline remains inappropriate for internal tool screens and will be removed from desktop layouts
- desktop navigation will move out of the bottom mobile bar treatment
- the mobile bottom navigation remains for smaller breakpoints
- the main content area will expand to use desktop width efficiently

### 3. Meals Screen

The Meals screen will become a **full-width browsing surface with modal editing**.

Decisions:

- the always-visible add/edit form will be removed from the page body
- the page will show:
  - a compact action bar
  - filter/search controls
  - a full-width meal list/grid
- `Add meal` opens a modal
- `Edit` opens the same modal prefilled for the selected meal
- closing the modal returns the user to the same browse position
- delete remains a separate explicit action with confirmation

### 4. Settings Information Architecture

Settings will be split into **focused sections**, not one long maintenance page.

Decisions:

- Settings will be divided into separate sections for:
  - Meal Slots
  - Categories
  - Store Tags
- each section will present a compact list/table-like browsing surface
- add/edit flows for these records will use modals
- only the currently active section is shown at a time

### 5. Icon Library Placement

The Icon Library will **not** remain inline on the main Settings page.

Decisions:

- the icon library moves to its own dedicated screen or dedicated Settings subsection
- the default Settings experience will focus on routine maintenance tasks, not icon browsing
- icon browsing will still support category assignment work, but it will no longer dominate the default page layout

Implementation choice:

- use a dedicated Settings subsection first, rather than a top-level app tab
- this keeps icon management adjacent to category management without making Settings unusable

### 6. Planner Desktop Layout

The planner will adopt a **desktop week grid**.

Decisions:

- desktop layout uses:
  - rows for days
  - columns for enabled meal slots
- mobile keeps the current stacked card model
- each desktop planner cell will become more compact than the current repeated card stack
- detailed category/meal picking will move into a focused interaction surface per cell rather than always rendering the full control stack inline

### 7. Density Rules

The following rules apply across the redesign:

- do not keep unrelated maintenance tools visible at the same time on desktop
- do not render giant top-of-page marketing-style copy on internal tool screens
- do not require users to scroll away from the selected record just to edit it
- do not use long stacks of repeated cards when a grid, table-like list, or sectioned layout will scan faster
- do keep mobile touch targets generous
- do keep add/edit/delete workflows obvious and recoverable

## Implementation Order

This order is now fixed for the next iteration cycle:

1. Refactor the desktop app shell.
2. Refactor Meals to modal add/edit.
3. Refactor Settings into sectioned navigation and modal maintenance flows.
4. Move Icon Library into its own Settings subsection.
5. Refactor the planner into a desktop week grid.

## Completed Slices

Completed slices so far:

1. compact desktop app shell
2. Meals screen modal editing
3. Settings sectioning and modal maintenance flows
4. Icon Library moved into its own Settings subsection
5. first desktop planner density pass
6. desktop polish passes for grocery and magnet export

## Acceptance Criteria

### App Shell

- desktop screenshots no longer show a landing-page-style hero above the main tool
- desktop navigation is not presented as the primary bottom navigation bar
- the primary work surface uses materially more horizontal space than today

### Meals

- there is no always-visible add/edit meal form in the page body
- `Add meal` opens a modal
- `Edit` opens a modal for that specific meal
- closing the modal returns the user to the same list position
- filtering and browsing remain visible and usable without page repositioning

### Settings

- meal slots, categories, and store tags are not all visible in one long scroll by default
- icon browsing is not inline with the default maintenance flow
- add/edit flows use modals rather than embedded page-length forms

### Planner

- desktop week planning becomes more scannable than the current stacked-card layout
- a user can visually compare multiple days without scrolling through repeated tall sections

## Remaining UI Work

The next UI steps are now narrower and more concrete:

1. Planner interaction polish:
   - reduce remaining vertical space inside populated slot cells
   - make category and meal editing in a cell feel faster than the current stacked controls
   - review the command bar and preview relationship after more real-data usage
2. Navigation polish:
   - revisit active-page highlighting in both expanded and compact sticky-nav states
3. Settings follow-up polish:
   - improve icon search/filtering if the icon library keeps growing
   - add missing-icon validation/reporting
4. Meals follow-up polish:
   - add regression coverage around modal editing and ingredient interactions
5. Cross-screen quality pass:
   - richer loading, empty, and error states where screens still feel thin
   - manual QA notes for the most visually sensitive workflows

## Validation

Required checks:

```bash
npm run build -w frontend
npm test -w frontend
npm run test:e2e -w frontend
```

Required screenshot review after each major UI slice:

- `Meals` desktop
- `Settings` desktop
- `Plan` desktop

Required manual review:

- modal open/close behavior
- focus return after closing modals
- desktop width usage
- mobile usability for any modal introduced

## Follow-Up Notes

- Revisit desktop active-page highlighting in the primary navigation after the planner density pass. The active state is improved, but it still needs a final polish review so the current page remains unmistakable in both expanded and compact sticky-nav states.
