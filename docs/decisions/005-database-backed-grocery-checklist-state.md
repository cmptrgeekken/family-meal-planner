# 005: Database-Backed Grocery Checklist State

## Status

Proposed

## Context

The grocery screen currently generates grocery output from saved weekly plans, but checked shopping items are stored in browser `localStorage`.
That works on one device, but it breaks down during real household use:

- A grocery list checked on one phone does not carry to another phone.
- A parent cannot start checking items on a tablet and finish on a phone.
- Browser storage can be cleared independently from the app database.
- Future household/user support needs grocery progress to belong to the household's plan, not to a browser.

The app is intended to be practical in a real shopping trip, so grocery checklist state should persist with the same reliability as meals and weekly plans.

## Decision

Persist grocery checklist state in the database.

Checklist state should belong to a household and a weekly planning context.
Once ADR 004 is implemented, grocery checklist records should be household-scoped.

The first implementation should track checked state for generated grocery items from a saved weekly plan.
It should not turn grocery generation into a fully editable shopping-list system yet.

Use stable generated grocery item identity rather than storing display strings as the primary key.
For the current grocery model, the most useful stable identity is the ingredient used by the saved weekly plan.

The first implementation should support:

- loading checked state with the grocery list
- checking and unchecking an item from any device using the same backend/database
- clearing checked state for a week
- preserving grocery generation diagnostics such as used-in meals separately from checked state

Slot-filter behavior should remain simple at first.
Checked state should be shared across filtered and unfiltered views for the same weekly plan item.
For example, if "eggs" is checked while viewing Breakfast only, it should also appear checked in the full-week grocery list when the same ingredient appears there.

If families later need independent shopping trips for different stores, days, or slot filters, introduce explicit shopping sessions or saved grocery lists rather than overloading the basic checked-state table.

## Data Model Direction

Add a persisted grocery checklist model tied to the saved weekly plan and household.

Recommended starting shape:

```prisma
model GroceryChecklistItem {
  id           String   @id @default(cuid())
  householdId  String
  weeklyPlanId String
  ingredientId String
  checked      Boolean  @default(false)
  checkedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([weeklyPlanId, ingredientId])
}
```

When ADR 004 lands, include household relations and ensure the household matches the weekly plan and ingredient households.

The table stores state for generated items, not a permanent copy of the full generated grocery list.
The grocery list should continue to be derived from weekly plan selections and meal ingredients.

If a generated ingredient disappears from a plan, stale checklist records may remain harmlessly or be cleaned up during save/regeneration.
The first implementation should favor correctness and simplicity over aggressive cleanup.

## API Direction

Extend weekly-plan grocery responses to include checked state on each grocery item.

Add a small checklist mutation surface, such as:

- `PUT /api/weekly-plans/:weekStartDate/grocery-checklist/:ingredientId`
- `PUT /api/weekly-plans/:weekStartDate/grocery-checklist`
- `DELETE /api/weekly-plans/:weekStartDate/grocery-checklist`

The exact route shape can be finalized during implementation, but it should support:

- marking one generated item checked or unchecked
- optionally bulk-updating checked state
- clearing a week's checked state

The API should reject checklist updates for ingredients that are not part of the generated grocery list for the saved weekly plan.
That prevents orphan checklist state from arbitrary ingredient IDs.

For concurrency, last write wins is acceptable for the MVP.
If real-time collaboration becomes important, add polling or live sync later.

Checklist responses should include enough plan metadata for the UI to detect when grocery output may have changed since it was loaded.
At minimum, expose the saved weekly plan's `updatedAt` value or a generated grocery version token with grocery responses.
This gives the shopping screen a way to explain that the plan changed while someone was shopping instead of silently reshaping the list.

## UX Direction

The grocery screen should behave like the current checklist, but the state should follow the saved plan across devices.

UX expectations:

- show checked items immediately after a toggle
- keep optimistic UI if implementation complexity stays reasonable
- make loading and error states visible when checklist updates fail
- keep the phone shopping view fast and calm
- avoid requiring users to understand whether checklist state is local or remote

When a saved weekly plan changes, checked state should be preserved for ingredients that still appear and ignored or cleaned up for ingredients that no longer appear.

If a loaded grocery list becomes stale because the saved plan or meal ingredients changed, the UI should favor a calm warning and refresh action over surprising in-place churn during shopping.

## Consequences

Benefits:

- Grocery progress works across devices that share the same backend/database.
- Shopping state becomes part of the self-hosted backup story.
- The model stays grounded in generated grocery output instead of prematurely becoming a recipe or shopping-list product.
- Household scoping has a concrete user-facing payoff.

Costs:

- Grocery generation needs to merge derived grocery items with persisted checked state.
- UI toggles now depend on network/database availability.
- Stale checklist records can exist when plans change unless cleanup is added.
- Multiple people checking the same list concurrently may briefly overwrite each other under last-write-wins behavior.
- Live plan or meal edits can change grocery output while someone is shopping unless the week is locked or the UI clearly detects stale output.

## Follow-up

- Implement after or alongside household scoping so grocery checklist records have the right owner.
- Add backend tests for load, toggle, clear, and rejected orphan updates.
- Add frontend tests for persisted checked state behavior once the API exists.
- Include plan update metadata in grocery responses so stale shopping sessions can be detected.
- Consider explicit shopping sessions only after real use shows a need for multiple independent grocery trips per week.
