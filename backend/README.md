# Backend

This directory contains the Node-based API and business logic for the Family Meal Planner.

Current responsibilities:

- meal CRUD
- weekly planner rule enforcement
- grocery list generation
- persistence access
- input validation

Current starter stack:

- Node.js with Express
- TypeScript
- Prisma schema placeholder for future persistence
- Zod for request validation
- Vitest for unit and integration tests

Keep business rules explicit and testable. Logic such as repeat limits, premium-meal limits, cost balancing, and grocery aggregation should not live only in route handlers.

## Initial API Surface

- `GET /health`: liveness and environment information
- `GET /api/categories`: starter meal categories from the PRD
- `GET /api/meals`: in-memory sample meal catalog
- `POST /api/weekly-plans/preview`: validates a weekly plan and generates a grocery preview

## Next Steps

- replace in-memory seed data with Prisma-backed repositories
- add meal create and update endpoints
- persist weekly plans
- add authentication only when multi-user support becomes real scope
