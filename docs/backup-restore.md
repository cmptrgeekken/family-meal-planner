# Backup And Restore

Family Meal Planner stores application data in PostgreSQL. For self-hosted use, the database is the important state to protect.

The current Docker Compose setup stores data in the `postgres-data` named volume and runs PostgreSQL as the `db` service.

## What To Back Up

Back up the application database with `pg_dump`.

The curated frontend icon library is source-controlled in `frontend/public/icons` and does not need a runtime backup. Generated magnet exports should be saved separately by the user if they matter outside the app.

## Create A Backup

Start the database if it is not already running:

```bash
npm run dev:db
```

Create a timestamped backup directory:

```bash
mkdir -p backups
```

Create a compressed custom-format PostgreSQL backup:

```bash
docker compose exec -T db pg_dump \
  -U mealplanner \
  -d family_meal_planner \
  --format=custom \
  --no-owner \
  --no-acl \
  > backups/family-meal-planner-$(date +%Y%m%d-%H%M%S).dump
```

If your `.env` changes `POSTGRES_USER` or `POSTGRES_DB`, use those values in place of `mealplanner` and `family_meal_planner`.

## Verify A Backup

List the backup metadata without restoring it:

```bash
docker compose exec -T db pg_restore --list < backups/family-meal-planner-example.dump
```

For a higher-confidence test, restore into a disposable database or another environment before trusting the backup process.

## Restore A Backup

Restoring replaces data in the target database. Take a fresh backup first if the current data might matter.

Stop app containers that may write to the database:

```bash
docker compose stop api web
```

Restore the backup:

```bash
docker compose exec -T db pg_restore \
  -U mealplanner \
  -d family_meal_planner \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  < backups/family-meal-planner-example.dump
```

Start the app again:

```bash
docker compose up -d api web
```

## Full Volume Reset

Only remove the database volume when you intentionally want to discard local data.

```bash
docker compose down
docker volume rm family-meal-planner_postgres-data
docker compose up -d db
```

After a reset, run the app startup path so migrations and seed data are applied again:

```bash
npm run dev
```

## Suggested Household Routine

- Back up before updating the app or changing database-related configuration.
- Keep at least one backup somewhere outside the Docker host.
- Occasionally test restoring a backup into a disposable database.
- Treat `.env` as configuration, not as a data backup. Database contents still need `pg_dump`.
