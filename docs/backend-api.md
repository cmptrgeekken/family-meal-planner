# Backend API Reference

This document describes the current backend HTTP contract for the Family Meal Planner API.

Base assumptions:

- Local API base URL: `http://localhost:3001`
- JSON request and response bodies
- Planning is slot-aware. Breakfast, Lunch, and Dinner are seeded by default, and dinner remains the legacy default for older payloads.

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
      "slug": "pasta",
      "iconId": "168",
      "slotSlugs": ["dinner"],
      "weeklyMinCount": null,
      "weeklyMaxCount": 2
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
    "slug": "pasta",
    "iconId": "168",
    "slotSlugs": ["dinner"],
    "weeklyMinCount": null,
    "weeklyMaxCount": 2
  }
}
```

### Create category

`POST /api/categories`

Request:

```json
{
  "name": "Rice/Bowls",
  "slug": "rice-bowls",
  "iconId": "115",
  "slotSlugs": ["lunch", "dinner"],
  "weeklyMinCount": null,
  "weeklyMaxCount": 2
}
```

Notes:

- `iconId` is optional and may be `null`.
- `iconId` references the frontend icon manifest, not a database-backed icon asset.
- `slotSlugs` is optional. If omitted, the backend defaults the category to Dinner for backwards compatibility.
- Explicitly passing an empty `slotSlugs` array leaves the category unavailable in planner slot cells.
- `weeklyMinCount` and `weeklyMaxCount` are optional nullable non-negative integers.
- `weeklyMinCount` cannot be greater than `weeklyMaxCount`.
- Nullable category count fields may be omitted from responses when unset.

Response: `201 Created`

### Update category

`PUT /api/categories/:categoryId`

Request body matches create.

### Delete category

`DELETE /api/categories/:categoryId`

Response: `204 No Content`

Deletion rule:

- returns `409` if the category is still used by one or more meals

## Plan Slots

Plan slots are configurable planning occasions such as Breakfast, Lunch, and Dinner.

### List plan slots

`GET /api/plan-slots`

Response:

```json
{
  "planSlots": [
    {
      "id": "plan_slot_dinner",
      "name": "Dinner",
      "slug": "dinner",
      "sortOrder": 30,
      "isEnabled": true
    }
  ]
}
```

### Create plan slot

`POST /api/plan-slots`

Request:

```json
{
  "name": "Snack",
  "slug": "snack",
  "sortOrder": 40,
  "isEnabled": true
}
```

Notes:

- `sortOrder` and `isEnabled` are optional.
- Disabled slots are hidden from new planning defaults but historical saved selections can still be displayed by clients.

### Update plan slot

`PUT /api/plan-slots/:planSlotId`

Request body matches create.

### Reorder plan slots

`PUT /api/plan-slots/reorder`

Request:

```json
{
  "planSlotIds": ["plan_slot_breakfast", "plan_slot_lunch", "plan_slot_dinner"]
}
```

### Delete plan slot

`DELETE /api/plan-slots/:planSlotId`

Response: `204 No Content`

Deletion rule:

- returns `409` if the slot is used by saved weekly plan meals or category assignments

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
  "categoryIconId": "168",
  "categorySlotSlugs": ["dinner"],
  "categoryWeeklyMinCount": null,
  "categoryWeeklyMaxCount": 2,
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

Weekly plans store one meal per `(day, slot)` cell.
Legacy payloads without `slotSlug` still normalize to Dinner.

### Weekly plan selection shape

```json
{
  "day": "Monday",
  "slot": "Dinner",
  "slotSlug": "dinner",
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

Optional query params:

- `slotSlugs`, as a comma-separated list such as `dinner,lunch`, filters the generated `groceryList` while returning the full saved plan.

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
        "slotSlug": "dinner",
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
      "slotSlug": "dinner",
      "mealId": "meal_123"
    }
  ]
}
```

Notes:

- `slotSlug` is preferred and identifies the configured plan slot.
- Omitted slot information defaults to Dinner for backwards compatibility.
- preview response normalizes selections to include both `slot` and `slotSlug`.

Response:

```json
{
  "preview": {
    "weekStartDate": "2026-04-27",
    "selections": [
      {
        "day": "Monday",
        "slot": "Dinner",
        "slotSlug": "dinner",
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
      "slotSlug": "dinner",
      "mealId": "meal_123"
    }
  ]
}
```

Notes:

- the route param becomes the canonical `weekStartDate`
- `slotSlug` is preferred.
- omitted slot information defaults to Dinner for backwards compatibility.
- blocking validation must pass before the plan is persisted.
- unmet category minimums are returned as feedback but do not block saving.

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
        "slotSlug": "dinner",
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
- category weekly maximums block additional selections after the maximum is reached
- category weekly minimums are reported as feedback

Validation issue codes currently used:

- `unknown_meal`
- `unknown_plan_slot`
- `category_not_allowed_in_slot`
- `category_maximum_exceeded`
- `category_minimum_unmet`
- `duplicate_meal`
- `premium_limit_exceeded`
- `duplicate_day_slot`

## Notes for Frontend Work

- Treat `categorySlug` and `storeTagSlug` as the preferred stable identifiers for filtering and selection.
- Treat category `iconId` and meal `categoryIconId` as stable references into the frontend icon manifest.
- Use `slotSlug` for weekly-plan mutations; treat `slot` as a display label in responses.
- Prefer `preview` before `PUT` when you want rule feedback without saving changes.
- Expect deletion operations to return `409` when a record is still in use by related data.
