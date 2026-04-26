# 009: Child Category Suggestion Flow

## Status

Proposed

## Context

The PRD calls for kid-friendly participation in meal planning.
The current app has parent-oriented planning, meal management, grocery, settings, and magnet export surfaces.

Children do not need access to most of those surfaces.
They need a simple way to participate without accidentally changing meals, settings, grocery output, or the final saved plan.

The right first child-facing workflow is category suggestion, not full planning.
Children can express what kinds of meals they want for the week while parents remain responsible for assigning actual meals, balancing constraints, and saving the final plan.

## Decision

Add a dedicated child-facing route for weekly category suggestions.

Use a route such as:

```text
/kids
```

The child route should present a focused, visual category picker.
It should not show the normal parent app shell, settings, meal admin, grocery checklist, or magnet export UI.

Children should choose category suggestions for the week without assigning days.
Their choices are soft suggestions for parents, not constraints and not direct mutations to the saved weekly plan.

The picker should support Breakfast, Lunch, and Dinner suggestions when those slots are enabled for child picking.
Slot participation should be configurable through meal slot settings.
For example, a household may allow kids to suggest dinner only, or all enabled meal slots.

Anonymous household-level picking is enough for MVP.
Do not require child accounts, names, avatars, or per-child vote limits in the first implementation.

Future enhancements may add:

- child personas or names
- per-child picks
- per-slot pick limits
- parent approval states
- richer kid-specific visuals

## Data Model Direction

Add a weekly child suggestion model that belongs to the household and week.

The model should store category suggestions by slot, not by day.

Possible shape:

```prisma
model WeeklyCategorySuggestion {
  id            String   @id @default(cuid())
  householdId   String
  weekStartDate DateTime
  planSlotId    String
  categoryId    String
  createdAt     DateTime @default(now())

  @@unique([householdId, weekStartDate, planSlotId, categoryId])
}
```

When child personas become real scope, add persona/member identity to suggestions rather than replacing the household-level model.

Plan slots should include a setting that controls whether the slot appears in the child picker.
The exact field name can be finalized during implementation, but it should be explicit, such as:

- `isChildSuggestionEnabled`
- or `isKidPickerEnabled`

Only categories eligible for a slot should be shown for that slot.

If a suggested category or slot is later deleted, suggestion records may be cascaded with that deleted record.
If a slot is disabled for child picking or a category is no longer eligible for that slot, existing suggestions should be ignored in the active picker and parent planner rather than blocking planning.

## API Direction

Add APIs for child suggestions after household scoping exists.

Expected operations:

- get available child picker slots and categories for a week
- get current suggestions for a week
- replace suggestions for a week or for one slot

The parent planner should be able to read suggestions and surface them as guidance.

Child suggestion writes should not:

- create meals
- edit categories
- edit meal slots
- save weekly plans
- mutate grocery state

Before authentication exists, child suggestion APIs must remain narrow and safe for trusted private deployments.
They should expose only the category and slot data needed for the picker, accept only suggestion updates, and avoid returning parent/admin data.

Once authentication exists, child suggestion APIs should remain narrowly scoped and role-aware.

## UX Direction

The child route should be:

- visual
- touch-friendly
- low reading burden
- resilient to repeated taps
- calm enough that it does not become confusing

Suggested first behavior:

- choose a week using the existing selected week or a simple week selector
- show enabled child-picker slots
- show category cards per slot
- allow children to toggle category choices
- save suggestions automatically or with a simple done action
- show a clear completion state

Parent planner behavior:

- show kid category suggestions as hints near category selection
- do not auto-assign meals from child choices
- do not block parent choices when suggestions are ignored
- make it clear that parent decisions remain final

The picker should not require drag and drop.
Selected states should be perceivable without relying on color alone, and controls should remain keyboard and screen-reader usable even though the primary audience is touch-first.

## Consequences

Benefits:

- Kids can participate without accessing admin or grocery workflows.
- Parent planning keeps final control and responsibility.
- Slot-configurable child picking supports households that want breakfast/lunch/dinner input.
- Anonymous household-level suggestions avoid premature account design.

Costs:

- Parent planner needs a way to display suggestions without adding clutter.
- Suggestion state adds another weekly data surface.
- Slot configuration grows one more setting.
- Future child identities may require a migration or additive model extension.
- Disabled slots, deleted categories, and eligibility changes need explicit stale-suggestion handling.

## Follow-up

- Add a plan-slot setting for child picker eligibility.
- Add persistence for weekly category suggestions.
- Add a dedicated `/kids` route that hides parent navigation.
- Surface suggestions in the parent planner as soft guidance.
- Add tests for deleted categories, disabled child-picker slots, and changed category-slot eligibility.
- Add accessibility and touch-target coverage for the child picker.
