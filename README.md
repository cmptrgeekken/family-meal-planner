# Family Meal Planner

Family Meal Planner is a self-hosted application for planning meals with kids, building weekly meal schedules, and generating useful grocery lists with low friction.

This repository is currently in the initial project-setup stage. The goal of this first pass is to establish a clean structure for product, frontend, backend, and infrastructure work before deeper implementation begins.

## Current Focus

- Align implementation with [docs/prd-v1.md](/d:/Projects/family-meal-planner/docs/prd-v1.md)
- Use [AGENTS.md](/d:/Projects/family-meal-planner/AGENTS.md) as the shared contributor guide
- Build toward a self-hosted stack with React, Node, and PostgreSQL

## Initial Repository Structure

```text
.
|-- AGENTS.md
|-- README.md
|-- docker-compose.yml
|-- .env.example
|-- docs/
|   |-- prd-v1.md
|   `-- decisions/
|-- frontend/
|   |-- README.md
|   |-- index.html
|   |-- public/
|   `-- src/
|       |-- app/
|       |-- components/
|       |-- features/
|       |-- styles/
|       `-- test/
`-- backend/
    |-- README.md
    |-- Dockerfile
    |-- prisma/
    `-- src/
        |-- config/
        |-- domain/
        |-- routes/
        |-- services/
        `-- test/
```

## Architecture Direction

- `frontend/`: React-based SPA for parent and child workflows
- `backend/`: Node API for meal, planner, and grocery-list logic
- `backend/prisma/`: future database schema and migrations
- `docs/decisions/`: lightweight architecture and product decisions

## Working Agreements

- Keep the MVP centered on meal management, weekly planning, and grocery generation.
- Prefer clear boundaries between UI, domain logic, and persistence.
- Add tests alongside behavior as implementation begins.
- Use Docker-oriented local development from the start, even if the first version is simple.

## Next Likely Steps

1. Scaffold the frontend app shell and design tokens.
2. Scaffold the backend API and health endpoint.
3. Add package manifests and shared scripts.
4. Define the first Prisma schema for meals, ingredients, and weekly plans.
5. Add linting, type checking, unit tests, and an initial E2E harness.
