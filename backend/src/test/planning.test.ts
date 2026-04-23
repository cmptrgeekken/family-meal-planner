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
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
          { day: "Thursday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
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
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "burger-bowls" },
          { day: "Friday", slot: "Dinner", slotSlug: "dinner", mealId: "burger-bowls" },
        ],
      },
      meals,
    );

    expect(issues.some((issue) => issue.code === "premium_limit_exceeded")).toBe(true);
  });

  it("flags duplicate use of the same day and slot", () => {
    const issues = validateWeeklyPlan(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "burger-bowls" },
        ],
      },
      meals,
    );

    expect(issues.some((issue) => issue.code === "duplicate_day_slot")).toBe(true);
  });

  it("reports category weekly maximum and minimum feedback", () => {
    const issues = validateWeeklyPlan(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
          { day: "Tuesday", slot: "Lunch", slotSlug: "lunch", mealId: "burger-bowls" },
        ],
      },
      [
        { ...meals[0]!, categorySlug: "pasta", categoryWeeklyMinCount: 2 },
        { ...meals[1]!, categorySlug: "premium", categoryWeeklyMaxCount: 0 },
      ],
      { maxRepeatsPerMealPerWeek: 7, maxPremiumMealsPerWeek: 7 },
    );

    expect(issues.some((issue) => issue.code === "category_minimum_unmet" && issue.categorySlug === "pasta")).toBe(true);
    expect(issues.some((issue) => issue.code === "category_maximum_exceeded" && issue.categorySlug === "premium")).toBe(true);
  });
});
