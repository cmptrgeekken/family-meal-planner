# 📄 Product Requirements Document (PRD)

## 🍽️ Family Meal System (Self-Hosted SPA)

---

# 1. 🎯 Product Overview

### Purpose

Build a **self-hosted, family-oriented meal planning system** that:

* Reduces daily decision fatigue
* Engages kids in meal selection
* Automatically generates grocery lists
* Supports fast, realistic cooking workflows

---

### Core Philosophy

> “Make the easiest choice the correct choice”

---

### Target Users

* Busy parents with kids
* Households with picky eaters
* Users who prefer **local-first / self-hosted tools**

---

# 2. 🧠 Key Problems to Solve

### Current Pain Points

* “What’s for dinner?” decision fatigue
* Grocery planning inefficiency
* Kids resisting meals
* Over-reliance on convenience/junk food
* Disconnected tools (Notion, paper, memory)

---

### Desired Outcomes

* Weekly planning in **< 5 minutes**
* Grocery list auto-generated
* Meals align with kid preferences
* Parents can easily “upgrade” meals nutritionally

---

# 3. 🧩 Core Features (MVP)

---

## 3.1 🍽️ Meal Management

### Requirements

* Create/edit/delete meals
* Assign:

  * Category
  * Cost tier
  * Ingredients
  * Kid-friendly flag
  * Low-effort flag
  * Notes (parent upgrades)

---

## 3.2 🧒 Kid Meal Picker (Magnet Board UI)

### Requirements

* Visual category-based selection
* Drag/drop meals into weekly plan
* Categories:

  * Pasta
  * Rice/Bowls
  * Breakfast
  * Sandwich/Snack
  * Chicken
  * Ground Meat
  * Premium
  * Fun/Zero-Cook

---

### Behavior

* Limit: max 1 repeat per meal/week
* Visual, touch-friendly UI (tablet friendly)

---

## 3.3 📅 Weekly Planner

### Requirements

* Assign meals to days
* Show category distribution
* Enforce optional rules:

  * Max 1 premium meal/week
  * Balanced cost mix

---

## 3.4 🛒 Grocery List Generator

### Requirements

* Aggregate ingredients from selected meals
* Deduplicate items
* Group by:

  * Protein
  * Carb
  * Veg
  * Fruit
  * Extras

---

### Optional Enhancements

* Tag items:

  * Costco
  * Cub
* Checkbox for shopping progress

---

## 3.5 ⚡ Quick Decision Flow

### Requirements

* Built-in fallback system:

  * leftovers
  * ultra-fast meals
  * zero-cook meals

---

# 4. 🏗️ Technical Architecture

---

## 4.1 Stack (Updated for Node.js)

### Frontend

* React + Vite
* State: Zustand or simple React state
* UI: Tailwind (fast iteration)

---

### Backend

* Node.js (preferred)
* Framework:

  * Option A: Express (simple)
  * Option B: NestJS (structured, scalable)

👉 Recommendation: **Start with Express**, migrate later if needed

---

### Database

* PostgreSQL

---

### ORM

* Prisma (recommended for speed + DX)

---

### Infrastructure

* Docker + Docker Compose

Services:

* `web` (frontend)
* `api` (Node backend)
* `db` (Postgres)

---

# 5. 🗃️ Data Model (Core)

---

## Tables

### categories

* id
* name

---

### meals

* id
* name
* category_id
* cost_tier
* kid_favorite
* low_effort
* notes

---

### ingredients

* id
* name
* type (protein/carb/veg/etc.)
* store (Costco/Cub)

---

### meal_ingredients

* meal_id
* ingredient_id

---

### weekly_plans

* id
* week_start_date

---

### weekly_plan_meals

* weekly_plan_id
* meal_id
* day_of_week

---

# 6. 🎨 UX / UI Requirements

---

## 6.1 Kid Mode (Critical)

* Large buttons/cards
* Visual icons (SVG magnets)
* Minimal text
* Drag-and-drop interaction

---

## 6.2 Parent Mode

* Fast editing
* Table views
* Bulk actions

---

## 6.3 Mobile Support

* Must work on phone
* Tablet-first for kitchen use

---

# 7. 🔁 Core User Flow

---

## Weekly Planning (Primary Flow)

1. Open app
2. Kids select meals (board UI)
3. Assign to week
4. View auto-generated grocery list
5. Shop

---

## Daily Execution

1. Check today's meal
2. Apply parent upgrade:

   * protein
   * vegetable
   * flavor
3. Cook

---

# 8. 🚀 Future Features (Roadmap)

---

## 🧲 Phase 2: Enhanced Kid System

* Magnet-style UI with drag/drop
* Points/reward system
* “Try new food” tracking

---

## 🛒 Phase 3: Smart Grocery System

* Quantity estimation
* Pantry tracking
* Auto-detect duplicates across weeks
* Costco aisle grouping

---

## 🍳 Phase 4: Cooking Intelligence

* Step-by-step “how to upgrade this meal”
* Flavor suggestions per category
* Equipment-aware cooking:

  * Instant Pot
  * Air fryer
  * oven/stove

---

## 🧾 Phase 5: Printables & Export

* Printable weekly plan
* Printable shopping list
* SVG magnet export (already partially done)

---

## 📊 Phase 6: Insights

* Meal frequency tracking
* Cost estimation per week
* Nutrition approximation (optional)

---

## ☁️ Phase 7 (Optional)

* Sync across devices
* Multi-user households
* Backup/export

---

# 9. 🔒 Non-Goals (for now)

* No calorie tracking
* No complex meal prep planning
* No social features
* No external integrations initially

---

# 10. 🧪 MVP Definition

The product is “done” when:

✅ Kids can pick meals visually
✅ Meals map to ingredients
✅ Weekly plan generates grocery list
✅ Runs locally via Docker
✅ No external dependencies (Notion eliminated)

---

# 11. ⚖️ Design Principles

* Simplicity > completeness
* Defaults > customization
* Local-first > cloud-first
* Speed > polish (early)
