# 004: Household-Scoped Data Ownership

## Status

Proposed

## Context

Family Meal Planner is currently shaped like a single-household self-hosted app.
That has been a good MVP default, but multi-device testing and future user support need a clearer data boundary.

The important ownership unit for this product is the household, not an individual user:

- A family shares meals, categories, meal slots, weekly plans, grocery lists, and store preferences.
- Parents and children may eventually have different capabilities, but they are usually acting inside the same household plan.
- Self-hosted installs may stay single-household forever, but the schema should not make household separation hard later.

The current database uses global uniqueness for records such as category slugs, meal slugs, store tag slugs, plan slot slugs, ingredient names, and weekly plan dates.
That is fine for one household, but it would force unrelated households to share naming and planning constraints.

## Decision

Introduce first-class household ownership before adding full multi-user authentication.

Add a `Household` model as the primary data boundary for family-owned planning data.

Household-owned records should include:

- categories
- meals
- ingredients
- store tag options
- plan slots
- weekly plans
- future grocery checklist state

For the first implementation, create one default household during migration or seed setup and scope all existing data to it.
The app may continue to behave like a single-household app in the UI while the persistence layer becomes household-aware.
The default household should have a stable, discoverable identity so backups, restores, seed data, and future import/export flows can reliably refer to the same household boundary.

Use household-scoped uniqueness for names, slugs, and dates that are currently global.
For example:

- category slug should be unique per household
- meal slug should be unique per household
- store tag slug should be unique per household
- plan slot slug should be unique per household
- ingredient name should be unique per household
- weekly plan week start date should be unique per household

Weekly plans should use a uniqueness boundary like:

```prisma
@@unique([householdId, weekStartDate])
```

API and repository code should accept household context explicitly, even if the initial context is a default household resolved by the backend.
Avoid scattering direct "default household" lookups throughout business logic.

Authentication and per-user identity are deferred.
When they become necessary, add users as members of households rather than making users the owners of meals and plans.

Expected future user model:

- `User`
- `HouseholdMember`
- member role such as `OWNER`, `PARENT`, or `CHILD`

Role enforcement is out of scope for the household-schema foundation.

## Data Model Direction

Add `Household`:

- `id`
- `name`
- optional stable slug or key if implementation needs a deterministic default-household lookup
- timestamps

Add `householdId` foreign keys to household-owned records.

Backfill existing records into a default household.
Backup and restore flows should preserve household IDs and ownership relationships rather than creating a new household for restored data.

Update uniqueness constraints from global to household-scoped where appropriate.
Examples:

- `Category`: `@@unique([householdId, slug])`
- `Meal`: `@@unique([householdId, slug])`
- `Ingredient`: `@@unique([householdId, name])`
- `StoreTagOption`: `@@unique([householdId, slug])`
- `PlanSlot`: `@@unique([householdId, slug])`
- `WeeklyPlan`: `@@unique([householdId, weekStartDate])`

Preserve existing relationships between household-owned records by ensuring cross-record references remain within the same household.
For example, a meal should not reference a category owned by another household.

## API Direction

Initial API behavior can remain single-household.
The backend should resolve a default household context for every request and pass that context into repositories.

Do not expose household switching in the UI until there is a concrete product need.

Do not add user registration, login, roles, or session handling as part of the household foundation unless the app is being prepared for exposure outside a trusted self-hosted environment.

Future API shape may include:

- `GET /api/households`
- `GET /api/households/current`
- explicit household selection through authenticated membership

That future shape should build on repository scoping introduced now.

## Consequences

Benefits:

- The app gets a clean persistence boundary before multi-user features create pressure.
- Self-hosted single-household installs keep simple behavior.
- Future household import/export, backup, sharing, and member permissions have a natural owner.
- Household-scoped uniqueness avoids naming collisions between families.
- Repository boundaries become more explicit about data ownership.

Costs:

- Most repositories and tests will need household context.
- Migrations need careful backfill behavior for existing local data.
- Some globally unique fields become composite keys, which adds Prisma query verbosity.
- Cross-household integrity rules will need attention during create/update flows.

## Follow-up

- Add a migration and backfill for the default household.
- Update seed data to create records under the default household.
- Update repositories to require or resolve household context.
- Update backend tests to assert household scoping where practical.
- Update backup/restore docs to explain that household identity and ownership relationships are preserved.
- Revisit authentication and `HouseholdMember` only when multiple users or remote access becomes active scope.
