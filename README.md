# Family Meal Planner

Family Meal Planner is a self-hosted app for answering "what's for dinner?" with less friction. It helps families maintain a meal catalog, build weekly meal plans across configurable planning slots, involve kids through visual category choices, and generate grocery lists that are useful in a real shopping trip.

The project is past initial scaffolding. The current app includes a React frontend, an Express/Prisma backend, PostgreSQL persistence, seeded starter data, backend test coverage, and Docker-oriented local development.

## Current Product Shape

Implemented core flows:

- Parent-managed meal categories, including icon assignment.
- Meal create/edit/delete with category, cost tier, kid favorite, low effort, notes, ingredients, quantities, and store tags.
- Configurable Breakfast/Lunch/Dinner-style planning slots with saved weekly plans, replace/remove actions, and category eligibility by slot.
- Grocery generation from current or saved weekly plans, including deduplication, grouping, store tags, quantities, used-in diagnostics, and a persistent shopping checklist.
- Grocery filtering by selected meal slots.
- Child-friendly category/meal selection views.
- Category magnet/button SVG and PNG export using curated frontend icon assets.
- Desktop UI cleanup work has landed across the app shell, meals, settings, grocery, planner, and magnet export surfaces.

Important remaining work is tracked in [docs/project-checklist.md](docs/project-checklist.md). Near-term themes include planner interaction polish, docs/checklist cleanup as UI work lands, API error consistency, stronger E2E coverage for top workflows, and follow-up export testing.

## Developer Starting Points

- Product requirements: [docs/prd-v1.md](docs/prd-v1.md)
- Contributor guidance: [AGENTS.md](AGENTS.md)
- Implementation checklist: [docs/project-checklist.md](docs/project-checklist.md)
- Backend API contract: [docs/backend-api.md](docs/backend-api.md)
- Environment variables: [docs/environment.md](docs/environment.md)
- Backup and restore: [docs/backup-restore.md](docs/backup-restore.md)
- Self-hosting guide: [docs/self-hosting.md](docs/self-hosting.md)
- Decision records: [docs/decisions/](docs/decisions/)
- Backend notes: [backend/README.md](backend/README.md)
- Frontend notes: [frontend/README.md](frontend/README.md)

For substantial work, read the PRD, the relevant decision record, and the affected code before changing behavior.

## Stack

- Frontend: React, Vite, TypeScript, TanStack Query
- Backend: Node.js, Express, TypeScript, Zod
- Database: PostgreSQL
- ORM: Prisma
- Tests: Vitest, Supertest, isolated PostgreSQL test database
- Local infrastructure: Docker Compose

## Repository Map

```text
.
|-- AGENTS.md
|-- README.md
|-- docker-compose.yml
|-- .env.example
|-- docs/
|   |-- backend-api.md
|   |-- prd-v1.md
|   |-- project-checklist.md
|   `-- decisions/
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   |-- migrations/
|   |   `-- seed.mjs
|   `-- src/
|       |-- config/
|       |-- domain/
|       |-- repositories/
|       |-- routes/
|       `-- test/
`-- frontend/
    |-- public/
    |   `-- icons/
    `-- src/
        |-- app/
        |-- components/
        |-- features/
        |   |-- grocery/
        |   |-- magnets/
        |   |-- meals/
        |   |-- plan/
        |   |-- settings/
        |   `-- shared/
        `-- styles/
```

## Local Development

Prerequisites:

- Node.js and npm.
- Docker with Docker Compose available as either `docker compose` or `docker-compose`.
- Docker daemon access for your user.

Optional environment setup:

```bash
cp .env.example .env
```

The defaults are suitable for local development. The main ports are:

- Frontend: `http://localhost:3000` when using Vite through `npm run dev`
- Backend API: `http://localhost:3001`
- App database: `localhost:5432`
- Test database: `localhost:5433`

Install dependencies from the repository root:

```bash
npm install
```

Run the full hot-reload stack:

```bash
npm run dev
```

This starts the development PostgreSQL container, generates the Prisma client, applies migrations, seeds development data, and starts the backend API plus Vite UI.

To start only the development database:

```bash
npm run dev:db
```

## Useful Commands

From the repository root:

```bash
npm run dev
npm run dev:db
```

Backend:

```bash
cd backend
npm test
npm run test:unit
npm run typecheck
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Frontend:

```bash
cd frontend
npm run dev
npm run typecheck
npm run build
npm run test:e2e
```

## Testing

Backend tests are still the strongest automated coverage today. `npm test` from `backend/` starts the dedicated `db-test` container, generates Prisma client code, applies migrations, seeds test data, runs Vitest, and stops the test database afterward.

Frontend validation now includes TypeScript/build checks plus a Playwright UI review harness. The current Playwright coverage includes full-page desktop screenshots for the core screens and a focused planner interaction test using mocked API data.

Before considering meaningful code done, run the checks relevant to the changed area and note anything that could not be verified.

## API And Data Notes

The backend contract is documented in [docs/backend-api.md](docs/backend-api.md).

Current model highlights:

- Categories are data-driven and can reference a stable frontend `iconId`.
- Store tags are first-class records used by ingredients.
- Meals own meal-specific ingredient quantities through the join table.
- Weekly planning is slot-aware, with configurable plan slots and per-slot category eligibility.
- Grocery generation deduplicates ingredients from selected meals and keeps enough context to explain why each item appears.

## Working Agreements

This repo uses [AGENTS.md](AGENTS.md) as the shared operating manual. The short version:

- Keep the MVP centered on meal management, weekly planning, useful grocery output, and child-friendly participation.
- Prefer small, reviewable changes grounded in the PRD and current code.
- Keep business rules centralized and testable.
- Add or update tests when behavior changes.
- Preserve existing user work and avoid unrelated refactors.
- Update docs when behavior, setup, API contracts, data models, or architecture change.

## Self-Hosting Status

Docker Compose exists for local app, API, and PostgreSQL services. The current self-hosting path is documented in [docs/self-hosting.md](docs/self-hosting.md), with backup guidance in [docs/backup-restore.md](docs/backup-restore.md). Authentication, automated backups, HTTPS termination, and published container images are still future work.
