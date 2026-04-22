# Self-Hosting Guide

Family Meal Planner is designed to be self-hosted for a household. The current deployment path is Docker Compose with three services:

- `web`: nginx serving the React app and proxying `/api` and `/health` to the API service
- `api`: Node/Express backend with Prisma
- `db`: PostgreSQL

## Current Security Boundary

The app does not currently include authentication or authorization. Treat it as a trusted household app:

- Prefer running it on a private home network, VPN, or behind an access-controlled reverse proxy.
- Do not expose it directly to the public internet without adding an external authentication layer.
- Use non-default database credentials for any long-running deployment.
- Keep `.env` out of source control.

This matches the MVP scope in [prd-v1.md](prd-v1.md): local-first, self-hostable, and practical before multi-user household features.

## Prerequisites

- Docker with Docker Compose.
- A host that can keep Docker volumes between restarts.
- A backup location outside the app container/volume.

## Configure

Create a local `.env` from the example:

```bash
cp .env.example .env
```

For self-hosting, change at least:

```dotenv
POSTGRES_PASSWORD=replace-with-a-real-password
NODE_ENV=production
```

Review the full variable list in [environment.md](environment.md).

## Build And Start

Build and start the production-style containers:

```bash
docker compose up -d --build db api web
```

By default:

- Web UI is available on `http://localhost:3000`.
- API health is available on `http://localhost:3000/health` through nginx.
- API routes are available under `http://localhost:3000/api`.

The API container runs Prisma migrations and seed data before starting. Seed data is intended to provide starter categories, store tags, and meals; it should not replace user-entered data.

## Update

Before updating, create a database backup:

```bash
mkdir -p backups
docker compose exec -T db pg_dump \
  -U mealplanner \
  -d family_meal_planner \
  --format=custom \
  --no-owner \
  --no-acl \
  > backups/family-meal-planner-before-update.dump
```

Then rebuild and restart:

```bash
docker compose pull db
docker compose up -d --build
```

See [backup-restore.md](backup-restore.md) for backup verification and restore commands.

## Reverse Proxy Notes

If another reverse proxy sits in front of the app:

- Route browser traffic to the `web` service or host port.
- Keep `/api/*` and `/health` on the same origin as the frontend when possible.
- Terminate TLS at the outer proxy.
- Add access control at the outer proxy if the app is reachable outside the trusted network.

The frontend Docker image is built with `VITE_API_BASE_URL=/api` by default, which assumes same-origin API access through the bundled nginx proxy.

## Backups

The persistent app state is PostgreSQL data in the `postgres-data` Docker volume. Back it up with `pg_dump`, not by copying container files while the database is running.

Recommended routine:

- Back up before app updates.
- Keep at least one backup off the Docker host.
- Test restores occasionally.

Detailed commands are in [backup-restore.md](backup-restore.md).

## Troubleshooting

Check container status:

```bash
docker compose ps
```

Check API health through the web container:

```bash
curl http://localhost:3000/health
```

View logs:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

Common issues:

- `web` is up but API calls fail: check `api` logs and `http://localhost:3000/health`.
- API cannot connect to the database: confirm the `db` service is healthy and `DATABASE_URL` matches the Compose service name when running in Docker.
- Port conflict on the host: change `WEB_PORT`, `API_PORT`, or `POSTGRES_PORT` in `.env`.
- Data disappeared after a reset: confirm the `postgres-data` volume was not removed and restore from backup if needed.

## Current Gaps

These are known limitations rather than accidental omissions:

- No built-in authentication yet.
- No first-class automated backup job yet.
- No HTTPS termination inside the bundled Compose stack.
- No CI-published images yet; local builds are the current path.
