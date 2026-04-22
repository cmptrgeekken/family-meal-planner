# Environment Variables

This document lists the environment variables used by the local and Docker Compose workflows.

For local development, copy [.env.example](../.env.example) to `.env` when you want to override defaults:

```bash
cp .env.example .env
```

The checked-in defaults are intended for a local development machine only. Use different database credentials for any long-running household deployment.

## Database

| Variable | Default | Used by | Notes |
| --- | --- | --- | --- |
| `POSTGRES_DB` | `family_meal_planner` | Docker Compose `db` | Application database name. |
| `POSTGRES_USER` | `mealplanner` | Docker Compose `db`, `db-test`, API connection strings | PostgreSQL user created by the containers. |
| `POSTGRES_PASSWORD` | `mealplanner` | Docker Compose `db`, `db-test`, API connection strings | Local default password. Change for self-hosting. |
| `POSTGRES_PORT` | `5432` | Docker Compose `db` | Host port for the application database. |
| `POSTGRES_TEST_DB` | `family_meal_planner_test` | Docker Compose `db-test` | Test database name. |
| `POSTGRES_TEST_PORT` | `5433` | Docker Compose `db-test` | Host port for the isolated test database. |
| `DATABASE_URL` | `postgresql://mealplanner:mealplanner@localhost:5432/family_meal_planner` | Backend, Prisma, root dev script | Application database URL used outside Compose. The API service gets an internal Compose URL in `docker-compose.yml`. |
| `TEST_DATABASE_URL` | `postgresql://mealplanner:mealplanner@localhost:5433/family_meal_planner_test` | Backend test workflow | Test database URL. Backend tests force Prisma to use this value. |

## Backend

| Variable | Default | Used by | Notes |
| --- | --- | --- | --- |
| `API_PORT` | `3001` | Docker Compose host port mapping | Host port exposed for the API container. |
| `PORT` | `3001` | Backend runtime | Port the Express server listens on inside the runtime. Compose sets this from `API_PORT`. |
| `NODE_ENV` | `development` | Backend runtime | Must be `development`, `test`, or `production`. |

## Frontend

| Variable | Default | Used by | Notes |
| --- | --- | --- | --- |
| `WEB_PORT` | `3000` | Docker Compose web host port | Host port for the production-style nginx container. |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` for local Vite, `/api` for Docker build | Frontend build/dev runtime | API base URL used by frontend fetch calls. Vite exposes this at build time through `import.meta.env`. |

## Port Summary

| Service | Local dev command | Docker Compose host port |
| --- | --- | --- |
| Frontend | `3000` via `npm run dev` in `frontend/` or root `npm run dev` | `WEB_PORT`, default `3000` |
| Backend API | `3001` | `API_PORT`, default `3001` |
| App database | `5432` | `POSTGRES_PORT`, default `5432` |
| Test database | `5433` | `POSTGRES_TEST_PORT`, default `5433` |

## Notes

- The root `npm run dev` script provides default `DATABASE_URL` and `VITE_API_BASE_URL` values if they are not set in the shell.
- The backend validates `NODE_ENV`, `PORT`, and `DATABASE_URL` on startup.
- The production-style API container runs Prisma migrations and seed data before starting the server.
- Frontend API configuration is build-time configuration. Rebuild the frontend image after changing `VITE_API_BASE_URL` for Docker deployments.
