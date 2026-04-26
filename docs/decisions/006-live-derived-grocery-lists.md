# 006: Live-Derived Grocery Lists

## Status

Proposed

## Context

The grocery screen currently derives grocery output from saved weekly plans and meal ingredients.
ADR 005 proposes database-backed checklist state so checked items follow the household across devices.

That raises a separate product question:

- Should grocery lists remain live views of the saved weekly plan?
- Or should the app create saved grocery-list snapshots that can diverge from later plan and meal edits?

Both models are valid, but they create different user expectations.
Snapshots are useful when a family wants to freeze a shopping trip.
Live derivation is simpler and better aligned with the current MVP, where the weekly plan is the source of truth.

## Decision

Keep grocery lists live-derived from the saved weekly plan for the MVP.

The grocery list should continue to be generated from:

- saved weekly plan selections
- meal ingredients
- selected slot filters

Persisted checklist state should be layered onto the generated grocery items.
The checked state should not turn the grocery list into a separate editable shopping-list record.

If an ingredient disappears from the generated list because the weekly plan or meal ingredients changed, stale checked state may remain in the database but should not be displayed.
If that ingredient later appears again for the same weekly plan, reusing the existing checked state is acceptable.

This means the current source of truth remains:

- weekly plan for what is being shopped for
- meal ingredients for what is needed
- grocery checklist records for whether generated items have been checked

Do not add saved grocery-list snapshots until real use shows that families need to preserve shopping trips independently from plans and meals.

To reduce surprises during shopping, the app may add a lightweight locked state to a saved weekly plan.
A locked week means the family has started treating the plan as shopping-ready, so edits that would change grocery output should be prevented or require an explicit unlock.
Locking the week is not the same as creating a grocery snapshot: grocery output is still derived from the saved plan, but the plan is protected from accidental changes during shopping.

## API Direction

Weekly-plan grocery responses should keep returning generated grocery items.
Each item may include a persisted checked flag once ADR 005 is implemented.

The API should avoid exposing grocery-list IDs for generated lists until snapshots exist.
Ingredient IDs or generated item keys are enough for MVP checklist updates.

When meal or plan changes affect grocery output:

- regenerated responses should reflect the latest saved data
- checklist records for no-longer-generated items should be ignored
- cleanup may happen opportunistically but is not required for correctness
- responses should expose plan update metadata so clients can detect stale shopping views

If weekly plan locking is implemented, plan and meal changes that affect a locked week's grocery output should either be blocked or require an explicit unlock flow.
The first implementation should prefer clear blocking over silent mutation.

## UX Direction

The grocery screen should behave like a live companion to the saved weekly plan.

Expected behavior:

- changing the saved weekly plan changes the grocery list
- editing meal ingredients changes future generated grocery output
- checked state remains visible only for items currently generated
- the UI should not imply that users have created a frozen shopping list
- if a week is locked, edits that would change grocery output should clearly explain that shopping is in progress or ready

If snapshot behavior is added later, it should be presented explicitly as a distinct action such as "Create shopping trip" or "Freeze list."
If week locking is added first, the action should use language such as "Lock for shopping" or "Unlock week" rather than "freeze list" so users understand the plan remains the source of truth.

## Consequences

Benefits:

- Keeps the MVP simple and explainable.
- Avoids duplicate grocery-list storage and sync rules.
- Grocery output stays current with meal and plan edits.
- Database-backed checklist state can be implemented without a larger shopping-list product.

Costs:

- A family cannot freeze a shopping trip independently from later plan edits.
- A checked item can disappear from the visible list after plan or ingredient changes.
- Reusing stale checked state may surprise users if an ingredient is removed and then re-added for the same week.
- A locked-week flow adds another state to explain and test.

## Follow-up

- Implement ADR 005 using generated grocery items plus persisted checked state.
- Decide whether the first database-backed checklist implementation should include weekly plan locking.
- Revisit grocery-list snapshots if families need multiple store trips, partial-week trips, or a stable list that survives plan edits.
- If snapshots are added, define how they relate to household backups, exports, and grocery diagnostics.
