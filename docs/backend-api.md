# Backend API Reference

This document describes the current backend HTTP contract for the Family Meal Planner API.

Base assumptions:

- Local API base URL: `http://localhost:3001`
- JSON request and response bodies
- Current planner behavior is dinner-first, with `slot: "Dinner"` as the default and only supported planning slot for now

## General Behavior

### Root

`GET /`

Returns basic API metadata.

Example response:

```json
{
  "name": "family-meal-planner-api",
  "version": "0.1.0",
  "environment": "development"
}
```

### Health

`GET /health`

Checks API and database availability.

Example response:

```json
{
  "status": "ok",
  "environment": "development",
  "databaseConfigured": true,
  "databaseReachable": true
}
```

## Error Shape

The API currently uses a small set of error response patterns.

### Validation failure

Used when a request body or query does not match the expected shape.

Example:

```json
{
  "error": "invalid_request",
  "message": "Meal payload is invalid.",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "slug": ["String must contain at least 1 character(s)"]
    }
  }
}
```

### Business rule failure

Used when a weekly plan violates planning rules.

Example:

```json
{
  "error": "invalid_weekly_plan",
  "message": "Weekly plan violates one or more planning rules.",
  "validationIssues": [
    {
      "code": "duplicate_day_slot",
      "message": "The Dinner slot on Monday already has a planned meal.",
      "mealId": "..."
    }
  ]
}
```

### Conflict

Used for uniqueness or deletion conflicts.

Example:

```json
{
  "error": "conflict",
  "message": "Meal slug already exists.",
  "field": "Meal slug"
}
```

### Not found / request failure

Example:

```json
{
  "error": "request_failed",
  "message": "Meal not found."
}
```

### Internal server error

Example:

```json
{
  "error": "internal_server_error",
  "message": "Unknown server error"
}
```

## Categories

Categories are data-driven and stored in the database.

### List categories

`GET /api/categories`

Response:

```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Pasta",
      "slug": "pasta"
    }
  ]
}
```

### Get category

`GET /api/categories/:categoryId`

Response:

```json
{
  "category": {
    "id": "cat_123",
    "name": "Pasta",
    "slug": "pasta"
  }
}
```

### Create category

`POST /api/categories`

Request:

```json
{
  "name": "Rice/Bowls",
  "slug": "rice-bowls"
}
```

Response: `201 Created`

### Update category

`PUT /api/categories/:categoryId`

Request body matches create.

### Delete category

`DELETE /api/categories/:categoryId`

Response: `204 No Content`

Deletion rule:

- returns `409` if the category is still used by one or more meals

## Store Tags

Store tags are data-driven and stored in the database.

### List store tags

`GET /api/store-tags`

Response:

```json
{
  "storeTags": [
    {
      "id": "storetag_costco",
      "name": "Costco",
      "slug": "costco"
    }
  ]
}
```

### Get store tag

`GET /api/store-tags/:storeTagId`

### Create store tag

`POST /api/store-tags`

Request:

```json
{
  "name": "Target",
  "slug": "target"
}
```

### Update store tag

`PUT /api/store-tags/:storeTagId`

Request body matches create.

### Delete store tag

`DELETE /api/store-tags/:storeTagId`

Response: `204 No Content`

Deletion rule:

- returns `409` if the store tag is still used by one or more ingredients

## Meals

Meals are persisted in the database and linked to categories.

### Meal shape

Example meal:

```json
{
  "id": "meal_123",
  "slug": "spaghetti-night",
  "name": "Spaghetti Night",
  "category": "Pasta",
  "categorySlug": "pasta",
  "costTier": "budget",
  "kidFavorite": true,
  "lowEffort": false,
  "notes": "Serve with a quick salad on the side.",
  "ingredients": [
    {
      "name": "Spaghetti",
      "group": "carb",
      "storeTag": "Other",
      "storeTagSlug": "other",
      "quantityLabel": "1 box"
    }
  ]
}
```

### List meals

`GET /api/meals`

Supported query params:

- `categorySlug`
- `storeTagSlug`
- `kidFavorite=true|false`
- `lowEffort=true|false`

Example:

`GET /api/meals?categorySlug=pasta&kidFavorite=true`

Response:

```json
{
  "meals": []
}
```

### Get meal

`GET /api/meals/:mealId`

### Create meal

`POST /api/meals`

Request:

```json
{
  "name": "Chicken Quesadillas",
  "slug": "chicken-quesadillas",
  "categorySlug": "chicken",
  "costTier": "standard",
  "kidFavorite": true,
  "lowEffort": true,
  "notes": "Add peppers and black beans for a parent upgrade.",
  "ingredients": [
    {
      "name": "Chicken",
      "group": "protein",
      "storeTagSlug": "costco",
      "quantityLabel": "1 pack"
    },
    {
      "name": "Tortillas",
      "group": "carb",
      "storeTagSlug": "other",
      "quantityLabel": "1 package"
    }
  ]
}
```

Notes:

- `group` must be one of `protein`, `carb`, `veg`, `fruit`, `extras`
- `storeTagSlug` is preferred when available
- `storeTag` is still accepted as a fallback input
- `ingredients` must contain at least one item

Response: `201 Created`

### Update meal

`PUT /api/meals/:mealId`

Request body matches create.

### Delete meal

`DELETE /api/meals/:mealId`

Response: `204 No Content`

Deletion rule:

- returns `409` if the meal is already used in a saved weekly plan

Conflict rule:

- duplicate meal slugs return `409 conflict`

## Weekly Plans

Weekly plans are currently dinner-first.
The API already includes `slot` in the contract so future multi-occasion planning can grow without a full redesign.

Current supported slot:

- `Dinner`

### Weekly plan selection shape

```json
{
  "day": "Monday",
  "slot": "Dinner",
  "mealId": "meal_123"
}
```

### List recent weekly plans

`GET /api/weekly-plans`

Optional query params:

- `limit` with max `20`

Example:

`GET /api/weekly-plans?limit=5`

Response:

```json
{
  "weeklyPlans": [
    {
      "id": "plan_123",
      "weekStartDate": "2026-04-27T00:00:00.000Z",
      "selections": []
    }
  ]
}
```

### Get weekly plan

`GET /api/weekly-plans/:weekStartDate`

Route param format:

- ISO date string, for example `2026-04-27`

Response:

```json
{
  "weeklyPlan": {
    "id": "plan_123",
    "weekStartDate": "2026-04-27T00:00:00.000Z",
    "selections": [
      {
        "day": "Monday",
        "slot": "Dinner",
        "mealId": "meal_123"
      }
    ]
  },
  "validationIssues": [],
  "groceryList": []
}
```

### Preview weekly plan

`POST /api/weekly-plans/preview`

This is a dry-run endpoint and does not persist anything.

Request:

```json
{
  "weekStartDate": "2026-04-27",
  "selections": [
    {
      "day": "Monday",
      "mealId": "meal_123"
    }
  ]
}
```

Notes:

- `slot` is optional and currently defaults to `Dinner`
- preview response normalizes selections to include `slot`

Response:

```json
{
  "preview": {
    "weekStartDate": "2026-04-27",
    "selections": [
      {
        "day": "Monday",
        "slot": "Dinner",
        "mealId": "meal_123"
      }
    ]
  },
  "validationIssues": [],
  "groceryList": [],
  "persisted": false
}
```

### Save weekly plan

`PUT /api/weekly-plans/:weekStartDate`

Route param:

- ISO date string, for example `2026-04-27`

Request:

```json
{
  "selections": [
    {
      "day": "Monday",
      "mealId": "meal_123"
    }
  ]
}
```

Notes:

- the route param becomes the canonical `weekStartDate`
- `slot` is optional and defaults to `Dinner`
- validation must pass before the plan is persisted

Response:

```json
{
  "weeklyPlan": {
    "id": "plan_123",
    "weekStartDate": "2026-04-27T00:00:00.000Z",
    "selections": [
      {
        "day": "Monday",
        "slot": "Dinner",
        "mealId": "meal_123"
      }
    ]
  },
  "validationIssues": [],
  "groceryList": []
}
```

### Weekly plan validation rules

Current rules:

- a meal must exist
- the same meal may appear at most once per week
- premium meals may appear at most once per week
- the same `(day, slot)` may appear at most once in the same weekly plan

Validation issue codes currently used:

- `unknown_meal`
- `duplicate_meal`
- `premium_limit_exceeded`
- `duplicate_day_slot`

## Notes for Frontend Work

- Treat `categorySlug` and `storeTagSlug` as the preferred stable identifiers for filtering and selection.
- Treat `slot` as part of the weekly-plan contract even though only `Dinner` is currently supported.
- Prefer `preview` before `PUT` when you want rule feedback without saving changes.
- Expect deletion operations to return `409` when a record is still in use by related data.
