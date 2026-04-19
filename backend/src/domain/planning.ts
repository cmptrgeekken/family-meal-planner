import type { Meal, PlanValidationIssue, WeeklyPlanPreview } from "./models.js";

export type WeeklyPlanRules = {
  maxRepeatsPerMealPerWeek: number;
  maxPremiumMealsPerWeek: number;
};

export const defaultWeeklyPlanRules: WeeklyPlanRules = {
  maxRepeatsPerMealPerWeek: 1,
  maxPremiumMealsPerWeek: 1,
};

export function validateWeeklyPlan(
  preview: WeeklyPlanPreview,
  meals: Meal[],
  rules: WeeklyPlanRules = defaultWeeklyPlanRules,
): PlanValidationIssue[] {
  const issues: PlanValidationIssue[] = [];
  const mealMap = new Map(meals.map((meal) => [meal.id, meal]));
  const repeatCount = new Map<string, number>();
  const occupiedDaySlots = new Set<string>();
  let premiumSelections = 0;

  for (const selection of preview.selections) {
    const daySlotKey = `${selection.day}:${selection.slot}`;

    if (occupiedDaySlots.has(daySlotKey)) {
      issues.push({
        code: "duplicate_day_slot",
        mealId: selection.mealId,
        message: `The ${selection.slot} slot on ${selection.day} already has a planned meal.`,
      });
      continue;
    }

    occupiedDaySlots.add(daySlotKey);

    const meal = mealMap.get(selection.mealId);

    if (!meal) {
      issues.push({
        code: "unknown_meal",
        mealId: selection.mealId,
        message: `Meal "${selection.mealId}" does not exist.`,
      });
      continue;
    }

    const currentCount = (repeatCount.get(selection.mealId) ?? 0) + 1;
    repeatCount.set(selection.mealId, currentCount);

    if (currentCount > rules.maxRepeatsPerMealPerWeek) {
      issues.push({
        code: "duplicate_meal",
        mealId: selection.mealId,
        message: `Meal "${meal.name}" exceeds the weekly repeat limit.`,
      });
    }

    if (meal.costTier === "premium") {
      premiumSelections += 1;
    }
  }

  if (premiumSelections > rules.maxPremiumMealsPerWeek) {
    issues.push({
      code: "premium_limit_exceeded",
      message: "The weekly plan exceeds the premium meal limit.",
    });
  }

  return issues;
}
