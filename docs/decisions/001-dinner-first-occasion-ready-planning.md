# 001: Dinner-First, Occasion-Ready Planning

## Context

The MVP for Family Meal Planner is centered on a fast, low-friction weekly planning flow.
For the primary target use case, that flow is mostly dinner planning.

At the same time, some households may eventually want to plan more than one meal occasion per day:

- breakfast
- lunch
- snack
- tea
- dinner

We want to avoid overbuilding multi-occasion planning into the MVP, but we also do not want to hard-code the backend around a permanent "one meal per day forever" assumption.

## Decision

For MVP:

- The planner remains dinner-first.
- The system behaves as a single-slot weekly planner.
- The default planning slot is `Dinner`.

To keep future expansion possible:

- Weekly-plan domain models should recognize the concept of a planning `slot` or `occasion`.
- Current API payloads may accept an optional slot value, but they should default to `Dinner`.
- Validation should treat `(day, slot)` as the uniqueness boundary, not just `day`.
- Database persistence may remain single-slot for now as long as the current implementation clearly maps to the default `Dinner` slot.

## Consequences

Benefits:

- We preserve a simple MVP experience for the primary user flow.
- We reduce the risk of a painful redesign when adding breakfast/lunch/snack planning later.
- We separate "what kind of meal this is" from "when this meal is planned."

Costs:

- Some domain and API shapes become slightly more abstract before the database fully supports multi-slot planning.
- The current data model still stores one entry per day, so true multi-occasion persistence remains a future migration.

## Follow-up

When multi-occasion planning becomes real scope:

- Add a first-class `slot` or `occasion` column to weekly plan entries.
- Decide whether occasions are system-defined, household-configurable, or both.
- Clarify the relationship between meal categories and supported occasions.
- Update grocery, validation, and UI flows to account for multiple planned meals per day.
