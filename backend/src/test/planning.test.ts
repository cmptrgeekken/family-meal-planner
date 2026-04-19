import { describe, expect, it } from "vitest";

import { validateWeeklyPlan } from "../domain/planning.js";
import { listMeals } from "../services/meal-catalog.js";

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
      listMeals(),
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
      listMeals(),
    );

    expect(issues.some((issue) => issue.code === "premium_limit_exceeded")).toBe(true);
  });
});
