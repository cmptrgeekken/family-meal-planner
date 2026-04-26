# 007: Authentication And Hosted Access Posture

## Status

Proposed

## Context

Family Meal Planner is self-hostable and currently assumes a trusted local development or home-network deployment.
The product may eventually be hosted outside the home network and accessed remotely.

The app also needs household-scoped data ownership before full multi-user identity.
ADR 004 introduces that household boundary.

Authentication matters, but adding accounts too early would slow the core meal-planning work and complicate local setup.
The product needs a clear posture so contributors know what to build now and what to defer.

## Decision

Do not add full authentication as part of the current household and grocery persistence work.

Prioritize:

- household-scoped data ownership
- database-backed grocery checklist state
- clear self-hosting guidance
- secure-enough defaults for local and private deployments

Treat externally hosted access as a future deployment mode that will require explicit authentication and authorization work before it is recommended.

When authentication becomes active scope, build it around household membership:

- users belong to households
- users do not directly own meals, categories, weekly plans, or grocery lists
- household roles determine what a user can do

Expected future roles:

- `OWNER`
- `PARENT`
- `CHILD`

The first auth implementation should protect parent/admin surfaces before attempting fine-grained collaboration features.

## Access Posture

Current posture:

- appropriate for local development
- appropriate for trusted private deployment
- not intended to be exposed directly to the public internet without additional access controls

Future externally hosted posture:

- require authentication
- require household membership scoping
- protect parent/admin routes and APIs
- keep child flows constrained to their intended input surface
- document reverse proxy, HTTPS, secrets, and backup expectations

Do not rely on the frontend alone to hide privileged actions once authentication exists.
Server routes should enforce household and role boundaries.

## API Direction

Before auth:

- resolve a default household context on the backend
- pass household context into repositories
- keep APIs single-household from the client's perspective

After auth:

- derive household access from the authenticated user
- reject cross-household access on the server
- enforce parent/admin permissions on mutation routes that change household data
- expose child-specific APIs only for the narrow suggestion flow

## UX Direction

Before auth:

- keep the app low-friction for self-hosted single-household use
- do not add login screens
- do not present user switching or household switching

After auth:

- parent/admin surfaces should require an authenticated parent or owner
- the dedicated child route may have a lighter entry model if product requirements allow it
- any lightweight child entry should still avoid exposing settings, meals admin, grocery mutation beyond intended scope, or household administration

## Consequences

Benefits:

- Keeps near-term implementation focused on the core family planning loop.
- Household scoping prepares the database for auth without forcing UI complexity now.
- Future external hosting has a documented security threshold.
- Server-side authorization remains a deliberate future requirement.

Costs:

- Public internet hosting remains out of recommended scope until auth exists.
- The first household-scoped implementation still behaves like a single-household app.
- Some future auth work will revisit route structure, API errors, and frontend navigation.

## Follow-up

- Keep self-hosting docs clear that unauthenticated deployments should be private or otherwise protected.
- Add authentication when external hosting or multiple household/member access becomes active scope.
- Define role-specific capabilities before adding `User` and `HouseholdMember`.
- Add authorization tests when auth lands.
