process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://mealplanner:mealplanner@localhost:5432/family_meal_planner";
