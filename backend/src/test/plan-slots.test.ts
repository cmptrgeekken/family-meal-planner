import { describe, expect, it } from "vitest";

import type { Meal } from "../domain/models.js";
import {
  getCategoryWeeklyCounts,
  getDaySlotKey,
  normalizeLegacyPlanSlot,
  normalizeWeeklyPlanSelections,
  selectionMatchesSlotFilter,
} from "../domain/plan-slots.js";

const meals: Meal[] = [
  {
    id: "spaghetti-night",
    name: "Spaghetti Night",
    category: "Pasta",
    categorySlug: "pasta",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: false,
    ingredients: [],
  },
  {
    id: "oatmeal",
    name: "Oatmeal",
    category: "Breakfast",
    categorySlug: "breakfast",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: true,
    ingredients: [],
  },
];

describe("meal slot helpers", () => {
  it("normalizes legacy display-name slots to slugs", () => {
    expect(normalizeLegacyPlanSlot("Dinner")).toEqual({ slot: "Dinner", slotSlug: "dinner" });
    expect(normalizeLegacyPlanSlot("Breakfast")).toEqual({ slot: "Breakfast", slotSlug: "breakfast" });
    expect(normalizeLegacyPlanSlot(undefined, "lunch")).toEqual({ slot: "lunch", slotSlug: "lunch" });
  });

  it("normalizes weekly plan selections and builds day-slot keys", () => {
    const [selection] = normalizeWeeklyPlanSelections([{ day: "Monday", mealId: "spaghetti-night" }]);

    expect(selection).toEqual({ day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" });
    expect(getDaySlotKey(selection!)).toBe("Monday:dinner");
  });

  it("matches optional slot filters", () => {
    const selection = { slotSlug: "dinner" };

    expect(selectionMatchesSlotFilter(selection)).toBe(true);
    expect(selectionMatchesSlotFilter(selection, [])).toBe(true);
    expect(selectionMatchesSlotFilter(selection, ["dinner"])).toBe(true);
    expect(selectionMatchesSlotFilter(selection, ["lunch"])).toBe(false);
  });

  it("counts selected categories across the whole weekly plan", () => {
    const counts = getCategoryWeeklyCounts(
      [
        { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
        { day: "Tuesday", slot: "Lunch", slotSlug: "lunch", mealId: "oatmeal" },
        { day: "Wednesday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
      ],
      meals,
    );

    expect(counts.get("pasta")).toBe(2);
    expect(counts.get("breakfast")).toBe(1);
  });
});
