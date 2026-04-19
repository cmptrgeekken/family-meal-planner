import { describe, expect, it } from "vitest";

import type { Meal } from "../domain/models.js";
import { validateWeeklyPlan } from "../domain/planning.js";

const meals: Meal[] = [
  {
    id: "spaghetti-night",
    name: "Spaghetti Night",
    category: "Pasta",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: false,
    ingredients: [],
  },
  {
    id: "burger-bowls",
    name: "Burger Bowls",
    category: "Ground Meat",
    costTier: "premium",
    kidFavorite: false,
    lowEffort: false,
    ingredients: [],
  },
];

describe("validateWeeklyPlan", () => {
  it("flags a repeated meal in the same week", () => {
    const issues = validateWeeklyPlan(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", mealId: "spaghetti-night" },
          { day: "Thursday", mealId: "spaghetti-night" },
        ],
      },
      meals,
    );

    expect(issues.some((issue) => issue.code === "duplicate_meal")).toBe(true);
  });

  it("flags more than one premium meal in a week", () => {
    const issues = validateWeeklyPlan(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", mealId: "burger-bowls" },
          { day: "Friday", mealId: "burger-bowls" },
        ],
      },
      meals,
    );

    expect(issues.some((issue) => issue.code === "premium_limit_exceeded")).toBe(true);
  });
});
