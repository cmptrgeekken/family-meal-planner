import type { ApiMeal } from "../shared/api";

export const plannerWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type PlannerWeekday = (typeof plannerWeekdays)[number];

export type PlannerSelections = Record<PlannerWeekday, string>;

export type PlannerRuleHints = {
  byDay: Record<PlannerWeekday, string[]>;
  summary: string[];
};

export function getPlannerRuleHints(
  selections: PlannerSelections,
  mealById: Map<string, Pick<ApiMeal, "name" | "costTier">>,
): PlannerRuleHints {
  const byDay = Object.fromEntries(plannerWeekdays.map((day) => [day, [] as string[]])) as Record<
    PlannerWeekday,
    string[]
  >;
  const summary = new Set<string>();
  const daysByMealId = new Map<string, PlannerWeekday[]>();
  const premiumDays: PlannerWeekday[] = [];

  for (const day of plannerWeekdays) {
    const mealId = selections[day];

    if (!mealId) {
      continue;
    }

    daysByMealId.set(mealId, [...(daysByMealId.get(mealId) ?? []), day]);

    if (mealById.get(mealId)?.costTier === "premium") {
      premiumDays.push(day);
    }
  }

  for (const [mealId, days] of daysByMealId) {
    if (days.length <= 1) {
      continue;
    }

    const mealName = mealById.get(mealId)?.name ?? "This meal";
    const message = `${mealName} is planned ${days.length} times; the current limit is once per week.`;
    summary.add(message);

    for (const day of days) {
      byDay[day].push(`Repeat limit: also planned on ${days.filter((otherDay) => otherDay !== day).join(", ")}.`);
    }
  }

  if (premiumDays.length > 1) {
    const message = `Premium limit: ${premiumDays.length} premium dinners selected; the current limit is one per week.`;
    summary.add(message);

    for (const day of premiumDays) {
      byDay[day].push("Premium limit: choose only one premium dinner this week.");
    }
  }

  return {
    byDay,
    summary: [...summary],
  };
}
