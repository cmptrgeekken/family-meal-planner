import { defaultPlanSlotName, type PlanSlotName, type WeekdayName, type WeeklyPlanMealInput } from "./models.js";

export type WeeklyPlanMealInputDraft = {
  day: WeekdayName;
  mealId: string;
  slot?: PlanSlotName;
};

export function normalizeWeeklyPlanSelections(
  selections: WeeklyPlanMealInputDraft[],
): WeeklyPlanMealInput[] {
  return selections.map((selection) => ({
    ...selection,
    slot: selection.slot ?? defaultPlanSlotName,
  }));
}
