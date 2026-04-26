# 008: Fast-Entry-First Ingredient Catalog

## Status

Proposed

## Context

Ingredients already exist as persisted records and drive grocery generation.
The current product need is practical meal entry and useful grocery output, not full recipe management.

There is a tension between:

- fast parent meal entry
- perfectly normalized ingredient data
- clean grocery grouping
- store-specific aisle or shopping metadata

For expected users, fast meal entry matters more than perfect catalog hygiene.
If entering meals feels fussy, families will not build enough data for planning and grocery generation to be useful.

## Decision

Treat ingredients as first-class household data, but optimize the UX and API for fast meal entry.

The meal editor should remain the primary place where ingredients are created and attached to meals.
Parents should be able to type ingredients quickly.
When a typed ingredient does not exist, saving the meal should create it.

Ingredient autocomplete should help reuse existing ingredients without forcing users into a separate ingredient management workflow.

Ingredient administration may exist for cleanup, but it should be secondary.
It can support tasks such as:

- renaming an ingredient
- changing the grocery group/type
- changing the store tag
- merging duplicates later if needed

Defer heavier catalog features until grocery pain proves they are worth the complexity.

Deferred features include:

- per-store aisle metadata
- different grocery groups per store
- ingredient aliases and synonym rules
- nutrition facts
- pantry inventory
- recipe-scale unit normalization
- import from external recipe managers

## Data Model Direction

Ingredients should be household-scoped once ADR 004 lands.

Keep the current ingredient fields lightweight:

- name
- grocery group/type
- optional store tag

Continue storing meal-specific quantity labels on the meal-ingredient relationship.
Do not attempt normalized unit math for MVP.

Future duplicate-management features may add:

- aliases
- merge history
- canonical ingredient references

Those should not be required for the first first-class ingredient pass.

## API Direction

Meal create/update APIs should support typing ingredient names inline.

Expected behavior:

- reuse existing ingredient records when names match within the household
- create missing ingredient records during meal save
- preserve meal-specific quantity labels
- keep validation helpful but not fussy

Ingredient list/search APIs should support autocomplete in the meal editor.
They do not need to become a full catalog administration API before the meal-entry flow improves.

## UX Direction

The meal editor should favor speed:

- type ingredient names directly
- show lightweight autocomplete suggestions
- allow quick add without leaving the modal
- avoid making parents classify everything before saving

Ingredient cleanup can live in Settings or a future maintenance view.
It should not block meal entry.

When group/store metadata is missing, the app can use safe defaults and allow cleanup later.
For typed ingredients created during meal save, the default should be `EXTRA` with no store tag unless the user selects more specific metadata.
This keeps meal entry fast while preserving a predictable grocery grouping fallback.

## Consequences

Benefits:

- Parents can build the meal catalog faster.
- Grocery generation improves through reuse without forcing heavy catalog management.
- Ingredient data remains structured enough for future cleanup.
- The app avoids becoming a full recipe manager too early.

Costs:

- Grocery grouping may be imperfect at first.
- Duplicate ingredient names may still happen due to spelling or naming variation.
- Store and aisle precision remains limited.
- Cleanup tools will eventually matter if the catalog grows.

## Follow-up

- Add ingredient autocomplete to meal editing if it is not already sufficient.
- Add lightweight ingredient cleanup tools only after meal entry remains fast.
- Consider duplicate merge support once real household data shows repeated naming drift.
- Use `EXTRA` and no store tag as the default for fast-created ingredients until richer metadata is provided.
- Keep grocery grouping useful but forgiving.
