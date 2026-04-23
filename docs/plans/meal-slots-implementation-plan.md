# Meal Slots Implementation Plan

## Current Project Status

Implementation status: the first end-to-end meal-slot pass has landed across schema, backend API, planner UI, grocery filtering, settings management, and API/checklist documentation. Remaining work should focus on manual UX QA, richer E2E coverage, and any follow-up polish found while using multi-slot plans with real household data.

The project checklist shows the dinner-first MVP loop is largely implemented:

- category, meal, store-tag, weekly-plan, and grocery APIs exist
- parent meal/category management exists in the frontend
- weekly dinner plans can be saved, replaced, removed, previewed, and used for grocery generation
- grocery output includes deduplication, quantity labels, store tags, used-in diagnostics, and a persistent shopping checklist
- mobile/tablet usability has had an initial pass
- backend tests cover the main current routes and domain behavior

Open work relevant to this feature:

- migration/backfill guidance once real user data exists
- fast parent weekly planning workflow polish
- richer loading, empty, and error states
- E2E coverage for highest-value flows
- API error consistency review

## Goal

Support configurable Breakfast, Lunch, Dinner-style planning slots end to end:

- parents can configure slots
- categories can be assigned to one or more slots
- weekly plans can store meals per day and slot
- grocery lists can be generated for selected slots
- existing dinner-first data migrates safely

## Scope

In scope:

- backend schema, repositories, routes, validation, and tests
- frontend API types and screen updates for planning, grocery, and settings
- API documentation updates
- project checklist updates as work lands

Out of scope for the first pass:

- drag/drop magnet board interactions
- per-person meal planning
- nutrition or calorie tracking
- complex recurring meal templates
- sub-week or multi-week grocery filtering
- authentication or household multi-tenancy

## Phase 1: Domain And Schema

1. Add `PlanSlot` and category-slot join models to Prisma.
2. Add nullable `weeklyMinCount` and `weeklyMaxCount` fields to `Category`.
3. Add `planSlotId` to `WeeklyPlanMeal`.
4. Replace weekly plan uniqueness with `(weeklyPlanId, dayOfWeek, planSlotId)`.
5. Add migration SQL that:
   - seeds enabled Breakfast, Lunch, and Dinner slots
   - backfills existing weekly plan meals to Dinner
   - assigns existing categories to Dinner
6. Replace hard-coded `planSlotNames = ["Dinner"]` with slot records in repository-backed flows.
7. Add pure helpers for:
   - day-slot keys
   - legacy slot normalization
   - slot filter matching for grocery generation
   - category weekly count calculation and limit checks

Validation:

- backend schema migration applies cleanly
- Prisma client generates
- domain unit tests cover slot normalization, day-slot uniqueness, and category weekly count limits

## Phase 2: Backend API

1. Add plan-slot repository and routes.
2. Include plan-slot routes in `/api`.
3. Update category repository/routes to read and write `slotSlugs`, `weeklyMinCount`, and `weeklyMaxCount`.
4. Update weekly-plan repository/routes to persist and return slot-aware selections.
5. Preserve legacy input compatibility for `slot: "Dinner"` during the transition.
6. Update grocery generation to accept selected `slotSlugs`.
7. Add structured grocery usage context with day, slot, and meal identifiers so diagnostics do not rely on meal-name strings alone.
8. Enforce category weekly maximums during weekly-plan preview/save.
9. Return rule feedback for unmet category weekly minimums without blocking draft preview.

Validation:

- route tests for plan-slot CRUD
- delete tests proving default slots are deletable when unused
- delete tests proving slots cannot be deleted while used by plans or category assignments
- category tests for slot assignment
- category tests proving no slot assignments means unavailable in every planning slot
- category tests for weekly minimum/maximum validation
- weekly-plan tests for multiple slots on the same day
- weekly-plan tests for category maximum enforcement and minimum feedback
- grocery tests for all-slots and selected-slots generation
- grocery tests for structured usage context on generated items
- regression test proving existing dinner-only payloads still work

## Phase 3: Frontend Data Contracts

1. Add API client functions and types for plan slots.
2. Update category types to include `slotSlugs`, `weeklyMinCount`, and `weeklyMaxCount`.
3. Update weekly-plan selection state from day-keyed to day-slot-keyed.
4. Update grocery fetch/preview calls to pass selected slot filters.
5. Add category availability helpers that can tell the UI when a category is selectable, maxed out, below minimum, or unavailable for the active slot.
6. Keep legacy assumptions isolated in compatibility helpers where needed.

Validation:

- frontend TypeScript build
- focused utility tests for day-slot state helpers if non-trivial

## Phase 4: Planning UI

1. Fetch enabled plan slots and render them in configured order.
2. Change the planner into a day-by-slot layout that still scans quickly on mobile.
3. Filter categories by the active slot.
4. Disable or visually "x out" categories whose weekly maximum is already reached by selections in other day-slot cells.
5. Provide accessible text for disabled category states, such as `Special Dinner limit reached for this week`.
6. Keep category-first meal selection inside each day-slot cell.
7. Keep replace, remove, preview, save, and rule-hint behavior per day-slot selection.
8. Add empty states for no enabled slots and no eligible categories for a slot.

UX checks:

- dinner-only users can still plan quickly
- breakfast/lunch/dinner does not become visually overwhelming
- categories blocked by weekly limits are obvious without relying only on color or an icon
- controls remain touch-friendly on phone and tablet
- keyboard users can assign and remove meals without drag/drop

## Phase 5: Grocery UI

1. Add slot filter controls to the grocery screen.
2. Default to all enabled slots represented in the saved plan.
3. Regenerate grocery output when slot filters change.
4. Key shopping checklist persistence by week plus selected slot set.
5. Show compact default usage summaries, such as `Used in 3 meals` or selected slot names.
6. Keep filtering week-wide for the first release.
7. Keep expanded diagnostics available for full day/slot/meal context.

Validation:

- grocery list for dinners only excludes breakfast/lunch ingredients
- all-slots mode preserves expected current behavior after migration
- checklist state does not leak between different slot filters

## Phase 6: Settings UI

1. Add meal slot management:
   - create
   - rename
   - reorder
   - enable/disable
   - delete when unused
2. Add category slot assignment in the category editor.
3. Add category weekly minimum and maximum count fields.
4. Make category creation default to Dinner unless the user chooses different slots.
5. Allow default slots to be deleted when unused.
6. Surface clear errors when deleting an in-use slot, referencing an unknown slot, or saving invalid category count ranges.

Validation:

- settings updates persist through reload
- category-slot changes affect planner filtering immediately after refetch
- category weekly count changes affect planner category availability immediately after refetch
- deleting an in-use or category-assigned slot is blocked with a useful message

## Phase 7: Documentation And Checklist

1. Update `docs/backend-api.md`.
2. Update `docs/project-checklist.md` as milestones land.
3. Add migration/backfill notes once the migration exists.
4. Add manual QA notes for multi-slot planning and grocery filtering.

## Suggested Acceptance Criteria

- Existing dinner-only plans survive migration and appear as Dinner selections.
- Breakfast, Lunch, and Dinner are enabled after migration.
- Default slots can be deleted when unused.
- A household can plan Breakfast, Lunch, and Dinner for the same day.
- The backend rejects duplicate selections for the same `(day, slot)` cell.
- Category choices in a Dinner cell only show Dinner-eligible categories.
- Categories with no slot assignment are unavailable in all planning cells.
- Categories can define nullable weekly minimum and maximum counts.
- Categories at their weekly maximum are disabled or visually crossed out in other planning cells with accessible explanatory text.
- Weekly-plan preview/save enforces category weekly maximums and reports unmet minimums as rule feedback.
- Grocery generation can include all slots or only selected slots.
- Grocery filtering is week-wide for the first release.
- Grocery items include structured day/slot/meal usage context.
- The grocery UI keeps usage context compact by default and shows full context in expanded diagnostics.
- The shopping checklist is independent for different slot-filtered grocery trips.
- API docs describe slot and category-slot contracts.
- Relevant backend tests and frontend type checks pass.

## Suggested Implementation Order

1. Backend schema and migration.
2. Backend plan-slot/category/weekly-plan/grocery tests and routes.
3. Frontend API type updates.
4. Planning UI.
5. Grocery UI.
6. Settings UI.
7. Documentation and manual QA notes.

## Decisions Resolved Before Coding

- Breakfast, Lunch, and Dinner should all be enabled by default at migration.
- Default slots should be deletable when unused.
- A category with no slot assignments is unavailable everywhere.
- Categories should support weekly minimum and maximum counts.
- Category maximums should block additional category selections once reached.
- Category minimums should appear as planning feedback without blocking incomplete draft planning.
- Week-wide grocery slot filtering is sufficient for the first release.
- Sub-week and multi-week grocery filtering are future considerations.
- Grocery diagnostics should use structured day/slot/meal context in the API while the UI remains compact by default.
