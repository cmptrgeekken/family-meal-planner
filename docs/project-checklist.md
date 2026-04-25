# Project Checklist

This is the running implementation checklist for the Family Meal Planner repo.
It tracks shipped work, known gaps, and likely next steps across the whole project.

## Current Priority

The next product focus is the core family meal-planning loop.
The magnet/button export work is useful now because it supports immediate category testing with kids, but future export polish should stay secondary to making the app usable for weekly planning.

Priority order:

1. Let parents create and maintain their own meal categories and meals through the UI.
2. Let parents build, save, edit, and reuse a weekly dinner plan.
3. Generate a practical grocery list from the saved or in-progress weekly plan.
4. Make the grocery list usable on a phone during a real shopping trip.
5. Add child-friendly category/meal selection once parent-managed data exists.
6. Keep setup, backups, and self-hosting docs reliable enough for a home deployment.

Next major planning expansion:

- [x] Implement configurable Breakfast/Lunch/Dinner-style meal slots for planning, category eligibility, and grocery filtering. See [decisions/003-configurable-meal-slots.md](decisions/003-configurable-meal-slots.md) and [plans/meal-slots-implementation-plan.md](plans/meal-slots-implementation-plan.md).

Next UI focus:

- [ ] Continue UI polish after the first desktop/modal/settings/planner cleanup pass. See [plans/ui-iteration-plan.md](plans/ui-iteration-plan.md).

## MVP Critical Path

- [x] Add frontend category create/edit/delete UI so families can create their own planning categories.
- [x] Add frontend meal create/edit/delete UI.
- [x] Add parent-friendly ingredient editing inside meal management.
- [x] Save weekly plans from the planning screen.
- [x] Add fast replace/remove meal actions on an existing weekly plan.
- [x] Generate grocery output from the current or saved weekly plan instead of sample meal selections.
- [x] Add a phone-friendly shopping checklist experience.
- [x] Add child-friendly visual category/meal picking after custom categories are manageable.
- [x] Run a mobile/tablet usability pass across meal management, planning, and grocery flows.

## Infrastructure And Setup

- [x] Repository structure for frontend, backend, Prisma, Docker, and docs exists.
- [x] React/Vite frontend workspace exists.
- [x] Node/Express backend workspace exists.
- [x] PostgreSQL is configured through Docker Compose.
- [x] Root `npm run dev` starts the dev database, generates Prisma client, applies migrations, seeds data, and starts API/UI dev servers.
- [x] Dev tooling detects Docker Compose v2 or legacy `docker-compose`.
- [x] Dev tooling reports missing Docker Compose and Docker socket permission issues clearly.
- [x] Backend test runner starts and stops an isolated test database.
- [x] README documents local development prerequisites.
- [x] Add a first-class production/self-hosting guide.
- [x] Document backup and restore expectations for local PostgreSQL data.
- [x] Add environment variable reference documentation.

## Data Model And Persistence

- [x] Prisma schema exists for categories, meals, ingredients, store tags, meal ingredients, plan slots, weekly plans, and weekly plan meals.
- [x] Migrations exist for the initial schema, first-class store tags, category icon IDs, and configurable meal slots.
- [x] Seed data creates starter categories, store tags, meals, and meal ingredients.
- [x] Category records can store stable `iconId` values.
- [x] Store tag options are modeled separately from ingredients.
- [x] Add create/update/delete flows for all core records that need parent editing. Category, meal, meal-ingredient, and store-tag UI exists.
- [ ] Add migration/backfill guidance once real user data exists.
- [ ] Decide whether category display names and print labels should be separate fields.

## Backend API

- [x] Health endpoint exists.
- [x] Meal API exists.
- [x] Category API exists.
- [x] Store tag API exists.
- [x] Weekly plan API exists.
- [x] Plan slot API exists.
- [x] Grocery preview/generation logic exists.
- [x] Repository layer separates Prisma access from route handlers.
- [x] Domain logic exists for planning and grocery generation.
- [x] Server-side validation exists around API inputs.
- [x] Add explicit API documentation updates for all current route contracts.
- [ ] Add error response consistency review across all routes.
- [ ] Add authentication/authorization only when multi-user household support becomes in scope.

## Frontend App Shell

- [x] Main app shell and navigation exist.
- [x] Screens exist for plan, meals, grocery, magnets, and settings.
- [x] Shared section, empty-state, and status-message components exist.
- [x] Frontend build uses `@vitejs/plugin-react`.
- [x] Review mobile/tablet ergonomics for meal management, weekly planning, and grocery flows.
- [x] Add desktop-specific app shell layout so internal screens use width efficiently.
- [x] Reduce the oversized internal header treatment on desktop.
- [ ] Revisit active-page highlighting in the desktop primary navigation after the planner density pass.
- [ ] Add richer loading, empty, and error states where screens are still thin.
- [ ] Add accessible keyboard alternatives for any future drag/drop interactions.

## Meal Management

- [x] Meal list screen exists.
- [x] Meal data includes category, category icon, cost tier, kid favorite, low effort, notes, ingredients, quantity labels, and store tags.
- [x] Backend meal tests exist.
- [x] Add frontend category create/edit/delete UI so magnet and planning testing can use family-specific categories.
- [x] Add frontend meal create/edit/delete UI.
- [x] Add parent-friendly ingredient editing.
- [x] Add meal filtering/search beyond the current basic presentation.
- [x] Move meal add/edit flows into modal dialogs so list browsing remains full-width and editing does not require scrolling to the top.
- [ ] Add regression coverage for frontend meal interactions once editing exists.

## Weekly Planning

- [x] Weekly plan screen exists.
- [x] Weekly plan backend model and API exist.
- [x] Planning domain logic and tests exist.
- [x] Weekday/slot domain helpers exist.
- [x] Save weekly plans from the planning screen.
- [x] Add fast replace/remove meal actions for existing weekly plans.
- [x] Add category-first meal narrowing for parent planning.
- [x] Add configurable meal slots so families can plan Breakfast, Lunch, Dinner, or household-specific occasions.
- [x] Persist weekly plan meals by `(day, slot)` instead of dinner-only `(day)`.
- [x] Filter planner category choices by slot eligibility.
- [x] Add configurable category weekly minimum/maximum counts.
- [x] Disable or visually cross out category choices that have reached their weekly maximum.
- [x] Tighten populated slot-cell density and surface the latest preview feedback inline.
- [x] Add shared week navigation for plan and grocery screens.
- [ ] Add fast parent weekly planning workflow polish.
- [x] Explore a desktop planner grid with days as rows and meal slots as columns.
- [ ] Add child-friendly visual meal picker/magnet board interactions. Category buttons exist; drag/drop magnet board remains deferred.
- [x] Add non-drag accessible alternatives for assigning meals.
- [x] Add visible rule explanations when a planning choice is blocked.
- [ ] Expand planning constraints such as repeat limits, premium limits, and balanced cost mix as product decisions settle.

## Grocery

- [x] Grocery screen exists.
- [x] Grocery generation deduplicates ingredients from selected meals.
- [x] Grocery items are grouped by ingredient group.
- [x] Grocery output includes quantity labels, store tags, and used-in meals.
- [x] Grocery domain tests exist.
- [x] Generate grocery output from the current or saved weekly plan instead of sample meal selections.
- [x] Add persistent shopping checklist state for real shopping use.
- [x] Add stronger UX for real store use on phones.
- [x] Add diagnostics for why an item appears on the grocery list.
- [x] Add grocery slot filters so shopping trips can include only selected planned meal slots.

## Settings And Icon Assignment

- [x] Settings screen includes category icon assignment.
- [x] Icon manifest is loaded from `frontend/public/icons/manifest.json`.
- [x] Icon library browsing exists.
- [x] Category icon assignments persist through the API.
- [x] Add meal slot management.
- [x] Add category-to-slot assignment.
- [x] Split settings into focused sections for meal slots, categories, and store tags.
- [x] Move settings add/edit flows into modal dialogs.
- [x] Move Icon Library out of the default Settings maintenance view.
- [x] Allow categories to delete with bulk meal migration into a replacement category.
- [x] Allow store tags to delete with ingredient reassignment or tag clearing.
- [ ] Improve icon search/filtering if the icon library remains large.
- [ ] Add validation/reporting for categories referencing missing icon IDs.
- [ ] Decide whether user-uploaded icons are out of scope permanently or deferred.

## Magnet And Button Exports

- [x] Category magnet export supports immediate household testing with kid-facing physical planning aids.
- [x] Magnet export screen can select all, clear all, and toggle individual icon-ready categories.
- [x] Export preview is prioritized above the category list on small screens.
- [x] Export preview is sticky beside controls and category selection on wider screens.
- [x] Category selection list is scrollable so more categories do not push the preview away.
- [x] Layout settings support inches and millimeters.
- [x] Page width is configurable.
- [x] Inner diameter controls the finished face where icon and label content must fit.
- [x] Outer diameter controls the printed/cutout background circle and layout footprint.
- [x] Outer diameter is clamped so it cannot be smaller than inner diameter.
- [x] A fixed gutter is used for sheet edges, vertical gaps, and minimum horizontal gaps.
- [x] Icon size scales from inner diameter.
- [x] Label size scales from inner diameter.
- [x] Labels are constrained to 80% of the inner diameter.
- [x] Optional matched font sizing applies the smallest computed label size across all selected magnets.
- [x] Background color is configurable.
- [x] Foreground color is configurable for labels and embedded icon artwork.
- [x] Export settings persist in local storage across browser refreshes.
- [x] SVG downloads are self-contained by inlining icon artwork as SVG vectors.
- [x] PNG downloads are rasterized from the generated SVG at 300 DPI.
- [x] Download controls are available without scrolling through the category list.
- [x] Basic loading and error states exist for category, manifest, icon artwork, and PNG export failures.
- [x] Move SVG layout and export math out of `MagnetsScreen.tsx` into a dedicated utility module.
- [x] Add unit tests for row/column layout, inner/outer diameter behavior, label sizing, and sheet dimensions.
- [x] Add snapshot-style tests for generated SVG structure.
- [ ] Add a browser-level test that verifies downloaded SVGs contain embedded icon data instead of `/icons/...` paths.
- [ ] Add a browser-level test for PNG export success.
- [ ] Investigate Cricut Design Space SVG text import behavior. PNG export works for the current physical workflow, and SVG text renders in other tools, but Cricut may drop or substitute labels unless labels are converted to acceptable paths or supported font handling.
- [ ] Decide whether labels should support wrapping, truncation, or dedicated short print labels.
- [ ] Add icon normalization metadata if some icons have inconsistent visual weight, padding, or viewBox behavior.

Deferred export ideas:

- [ ] Add print presets for common button/magnet sizes if repeated physical testing shows they save time.
- [ ] Add page presets such as Letter, A4, and common printable sheet sizes if raw dimensions become cumbersome.
- [ ] Add optional cut guides, bleed guides, or inner-safe-area guides if physical cutting requires them.
- [ ] Decide whether the export tool should later support meal magnets, occasion magnets, or custom boards.
- [ ] Consider PDF export if the print workflow needs stronger physical sizing guarantees.
- [ ] Consider server-side export only if frontend SVG/PNG generation stops meeting practical needs.
- [ ] Revisit user-uploaded icons only with a clear sanitization and validation plan.

## Testing And Quality

- [x] Backend tests cover health, categories, store tags, meals, planning, weekly plans, and grocery behavior.
- [x] Frontend TypeScript build check runs through the frontend build script.
- [x] Dev/test scripts generate Prisma client before using it.
- [x] Add focused frontend component or interaction tests.
- [ ] Add broader E2E coverage for the highest-value flows. A Playwright screenshot harness and a focused planner interaction test already exist.
- [x] Add regression tests for magnet export layout and generated SVG structure. Browser-level download behavior remains open.
- [ ] Add linting if the project standardizes on a linter.
- [ ] Add CI once repository hosting/branch workflow is settled.

## Documentation

- [x] PRD exists.
- [x] Contributor guidance exists in `AGENTS.md`.
- [x] Backend API documentation exists.
- [x] Decision records exist for dinner-first planning and category icon magnet exports.
- [x] ADR and development plan exist for configurable meal slots.
- [x] Project checklist exists.
- [x] Keep API docs in sync with route changes.
- [x] Add environment variable reference documentation.
- [x] Document backup and restore expectations for local PostgreSQL data.
- [x] Add setup, deployment, backup, and troubleshooting docs as the self-hosting story matures.
- [ ] Add manual QA notes for complex visual/export workflows.

## Undocumented Features (Review and Prioritize These)
- [ ] Ability to assign meals to meal slots not just categories. I like the reduced category set, but, e.g., I may want meals within categories to only show up within certain meal slots. This could be especially relevant for a Takeout / Restaurant category where the restaurants are only relevant for certain times of day.
- [ ] Customizable ingredient groups, perhaps even linking to stores and store aisles. This would require some fleshing out and understandably could become more complicated than necessary.
- [ ] First-class ingredients. Ingredients can still be added to meals by typing, but autocomplete kicks in and surfaces existing ingredients. Saving the meals will persist any ingredients not already defined.
  - [ ] When specifying an ingredient, it can live in multiple stores, with different groups per store
- [ ] An import / export feature would be handy, especially for exporting grocery lists. We should research common formats for that. Importing from common platforms or as plain-text input would be handy
  - [ ] We could explore incorporating ChatGPT API's to parse the recipes and such into a structure import format. Note that I don't have a desire to turn this into an entire recipe management system.