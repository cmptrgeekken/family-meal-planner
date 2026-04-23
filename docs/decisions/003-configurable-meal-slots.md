# 003: Configurable Meal Slots For Weekly Planning

## Status

Proposed

## Context

The current MVP planner is dinner-first. ADR 001 intentionally introduced the concept of a planning slot while deferring true multi-slot persistence until the product needed it.

That time has arrived. The next planning increment should support households that want to plan more than dinner, commonly:

- Breakfast
- Lunch
- Dinner

The change also affects grocery generation and category management:

- A grocery trip may cover only some planned meals for the week.
- Meal categories should be assignable to one or more meal slots so families do not see every category in every time-of-day context.
- The UI should stay fast for tired parent planning and touch-friendly for child participation.

The current implementation has slot-aware domain/API language, but the database still stores one planned meal per day through `WeeklyPlanMeal @@unique([weeklyPlanId, dayOfWeek])`. The backend currently supports only the `Dinner` slot.

## Decision

Introduce first-class, household-configurable meal slots.

Default slots:

- Breakfast
- Lunch
- Dinner

All three default slots should be enabled during migration so the feature is visible immediately after the schema change lands.

Meal slots are ordered records, not hard-coded enum values. A self-hosted single-household install should be able to rename, disable, reorder, create, and delete slots where data rules allow it.

Default slots are not protected system records. They may be deleted when they are not referenced by saved weekly plan meals or category-slot assignments.

Use stable slot slugs for API writes and persistence-facing references. Display names may change without rewriting weekly plan history.

Persist weekly plan meals by `(week, day, slot)` instead of `(week, day)`.

Categories may be assigned to one or more meal slots. Category-slot assignment controls category visibility and meal filtering in planning screens, but it should not delete or rewrite existing meals.

A category with no slot assignments is unavailable in all planning slots. This keeps category eligibility explicit and avoids surprise appearances in meal-slot flows.

Categories may also define weekly selection limits. Store minimum and maximum weekly counts on the category so families can express rules such as:

- Special Dinner may be chosen at most once per week.
- Pasta may be chosen one to three times per week.

The first implementation should enforce category maximums during plan preview/save. Minimums should be represented as rule feedback so parents can see when a plan has not yet met a desired category count without blocking incomplete draft planning too early.

Grocery generation should accept a slot filter so a family can generate a list for:

- all planned meals in the week
- only selected slots, such as dinners only
- a mixed trip, such as breakfast and dinner for the week

For the first implementation, grocery filtering should be week-wide by selected slots. Future filtering may support sub-week or multi-week grocery windows, but that is deferred until the week-wide slot filter has been used in practice.

## Data Model Direction

Add a `PlanSlot` table:

- `id`
- `name`
- `slug`
- `sortOrder`
- `isEnabled`
- timestamps

Add a category-slot join table:

- `categoryId`
- `planSlotId`

Add weekly category count fields to `Category`:

- `weeklyMinCount`
- `weeklyMaxCount`

Both fields should be nullable. A null minimum means no minimum. A null maximum means no maximum.

Update `WeeklyPlanMeal`:

- add `planSlotId`
- replace `@@unique([weeklyPlanId, dayOfWeek])` with `@@unique([weeklyPlanId, dayOfWeek, planSlotId])`

Backfill existing data:

- create enabled Breakfast, Lunch, and Dinner slots
- map all existing weekly plan meals to Dinner
- assign existing categories to Dinner by default

Default category assignment for newly created categories should be Dinner unless the create request provides explicit slot slugs.

## API Direction

Add plan-slot endpoints:

- `GET /api/plan-slots`
- `POST /api/plan-slots`
- `PUT /api/plan-slots/:slotId`
- `DELETE /api/plan-slots/:slotId`

Deletion should be blocked when a slot is used by saved weekly plan meals. Disabling should remain possible for slots that should stop appearing in new planning flows.

Deletion should also be blocked while categories are assigned to the slot, because otherwise category eligibility would be silently rewritten.

Update category payloads to include slot eligibility:

- return `slotSlugs` on category records
- accept `slotSlugs` on create/update
- return and accept nullable `weeklyMinCount` and `weeklyMaxCount`
- reject unknown slot slugs
- reject invalid count ranges, such as a negative count or a minimum above the maximum

Update weekly plan selection payloads to prefer:

```json
{
  "day": "Monday",
  "slotSlug": "dinner",
  "mealId": "meal_123"
}
```

During migration, the backend may accept the legacy `slot: "Dinner"` shape and normalize it to `slotSlug: "dinner"` so existing frontend code and saved assumptions can be moved incrementally.

Update grocery preview/generation to accept an optional slot filter:

```json
{
  "slotSlugs": ["dinner"]
}
```

If omitted, grocery generation should include all planned slots so existing behavior remains useful after migration.

Grocery list items should expose structured usage context so the app can explain why an ingredient appears without relying on display strings alone. Prefer a shape like:

```json
{
  "day": "Monday",
  "slotName": "Dinner",
  "slotSlug": "dinner",
  "mealName": "Spaghetti Night",
  "mealId": "meal_123"
}
```

The exact field name can be finalized during API implementation, but it should support compact UI summaries and detailed diagnostics.

## UX Direction

The planner should become a week-by-slot grid while preserving the current category-first selection flow.

Planning behavior:

- show enabled meal slots in configured order
- allow each `(day, slot)` to have zero or one planned meal
- filter category choices by the active slot
- visually disable or "x out" categories that cannot be selected because their weekly maximum is already reached elsewhere in the plan
- explain disabled category states in accessible text and rule feedback
- filter meal choices by the selected category
- keep replace and remove actions available per planned meal
- keep non-drag controls as the baseline interaction

Grocery behavior:

- show selected slot filters near the top of the grocery screen
- default to all enabled slots with saved planned meals
- persist shopping checklist state separately per week and slot-filter combination
- keep the default shopping list calm, such as `Used in 3 meals` or a compact slot summary
- keep expanded diagnostics available for the full day/slot/meal context when a grocery item looks surprising

Settings behavior:

- add meal slot management
- add category slot assignment beside the existing category icon/name/slug editing
- keep defaults simple so households that only care about dinner can ignore the added flexibility

## Consequences

Benefits:

- The app supports more realistic family planning without abandoning the dinner-first MVP path.
- Grocery trips become more practical because families can buy for the meals they are actually covering.
- Category filtering keeps breakfast/lunch/dinner planning from becoming noisy.
- Weekly category limits make planning rules visible at the moment a parent or child chooses a category.
- Stable slugs make future renames safer.

Costs:

- Weekly planning UI complexity increases from seven assignable cells to up to twenty-one by default.
- Settings grows into real reference-data administration.
- Category configuration becomes more rule-like, so validation and UI copy need to stay clear.
- Migration, API docs, and tests must move together to avoid half-slot-aware behavior.
- Some current tests and frontend state shapes are day-keyed and will need to become day-slot-keyed.

## Accessibility And Product Guardrails

- Multi-slot planning must remain keyboard-operable.
- Touch targets need to stay large enough for child participation.
- The first release should avoid drag/drop-only interactions.
- The UI should not require households to configure meal slots before they can keep planning dinners.
- Nutrition and cost rules should remain simple until product rules settle for multi-slot planning.

## Open Questions

- Should disabling a slot hide it from historical plans, or only from new planning and filter defaults?
- Should meals later be assignable to slots directly, or is category-level eligibility enough for now?

## Implementation Plan

Track coding work in [../plans/meal-slots-implementation-plan.md](../plans/meal-slots-implementation-plan.md).

## Relationship To Previous Decisions

This ADR advances the follow-up work named in ADR 001. It keeps the dinner-first path as the safe default, but replaces the temporary single-slot persistence model with first-class configurable slots.
