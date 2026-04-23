import {
  defaultPlanSlotName,
  defaultPlanSlotSlug,
  type Meal,
  type PlanValidationIssue,
  type WeekdayName,
  type WeeklyPlanMealInput,
} from "./models.js";

export type WeeklyPlanMealInputDraft = {
  day: WeekdayName;
  mealId: string;
  slot?: string;
  slotSlug?: string;
};

export function slugifyPlanSlotName(slotName: string) {
  return slotName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeLegacyPlanSlot(slot?: string, slotSlug?: string) {
  const normalizedSlotSlug = slotSlug?.trim() || (slot ? slugifyPlanSlotName(slot) : defaultPlanSlotSlug);

  return {
    slot: slot?.trim() || (normalizedSlotSlug === defaultPlanSlotSlug ? defaultPlanSlotName : normalizedSlotSlug),
    slotSlug: normalizedSlotSlug,
  };
}

export function normalizeWeeklyPlanSelections(
  selections: WeeklyPlanMealInputDraft[],
): WeeklyPlanMealInput[] {
  return selections.map((selection) => {
    const normalizedSlot = normalizeLegacyPlanSlot(selection.slot, selection.slotSlug);

    return {
      ...selection,
      ...normalizedSlot,
    };
  });
}

export function getDaySlotKey(selection: Pick<WeeklyPlanMealInput, "day" | "slotSlug">) {
  return `${selection.day}:${selection.slotSlug}`;
}

export function selectionMatchesSlotFilter(selection: Pick<WeeklyPlanMealInput, "slotSlug">, slotSlugs?: string[]) {
  return !slotSlugs || slotSlugs.length === 0 || slotSlugs.includes(selection.slotSlug);
}

export function getCategoryWeeklyCounts(selections: WeeklyPlanMealInput[], meals: Meal[]) {
  const mealMap = new Map(meals.map((meal) => [meal.id, meal]));
  const counts = new Map<string, number>();

  selections.forEach((selection) => {
    const meal = mealMap.get(selection.mealId);

    if (!meal?.categorySlug) {
      return;
    }

    counts.set(meal.categorySlug, (counts.get(meal.categorySlug) ?? 0) + 1);
  });

  return counts;
}

export function validateCategoryWeeklyCounts(selections: WeeklyPlanMealInput[], meals: Meal[]): PlanValidationIssue[] {
  const counts = getCategoryWeeklyCounts(selections, meals);
  const categories = new Map<
    string,
    { name: string; weeklyMinCount?: number; weeklyMaxCount?: number }
  >();

  meals.forEach((meal) => {
    if (!meal.categorySlug) {
      return;
    }

    categories.set(meal.categorySlug, {
      name: meal.category,
      weeklyMinCount: meal.categoryWeeklyMinCount,
      weeklyMaxCount: meal.categoryWeeklyMaxCount,
    });
  });

  return [...categories.entries()].flatMap(([categorySlug, category]) => {
    const count = counts.get(categorySlug) ?? 0;
    const issues: PlanValidationIssue[] = [];

    if (category.weeklyMaxCount != null && count > category.weeklyMaxCount) {
      issues.push({
        code: "category_maximum_exceeded",
        categorySlug,
        message: `${category.name} is planned ${count} times; the current maximum is ${category.weeklyMaxCount}.`,
      });
    }

    if (category.weeklyMinCount != null && count < category.weeklyMinCount) {
      issues.push({
        code: "category_minimum_unmet",
        categorySlug,
        message: `${category.name} is planned ${count} times; the current minimum is ${category.weeklyMinCount}.`,
      });
    }

    return issues;
  });
}
