# Backend

This directory will contain the Node-based API and business logic for the Family Meal Planner.

Planned responsibilities:

- meal CRUD
- weekly planner rule enforcement
- grocery list generation
- persistence access
- input validation

Suggested near-term setup:

- Node.js with Express
- TypeScript
- Prisma for database access
- Zod or equivalent for request validation
- Vitest or Jest for unit and integration tests

Keep business rules explicit and testable. Logic such as repeat limits, premium-meal limits, cost balancing, and grocery aggregation should not live only in route handlers.
