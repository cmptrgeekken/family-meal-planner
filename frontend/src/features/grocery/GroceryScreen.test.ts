import { describe, expect, it } from "vitest";

import { getGrocerySlotOptions, getGroceryStoreSections } from "./GroceryScreen";
import type { ApiGroceryListItem, ApiPlanSlot, ApiWeeklyPlan } from "../shared/api";

const planSlots: ApiPlanSlot[] = [
  { id: "slot_breakfast", name: "Breakfast", slug: "breakfast", sortOrder: 0, isEnabled: true },
  { id: "slot_lunch", name: "Lunch", slug: "lunch", sortOrder: 1, isEnabled: true },
  { id: "slot_dinner", name: "Dinner", slug: "dinner", sortOrder: 2, isEnabled: true },
  { id: "slot_snack", name: "Snack", slug: "snack", sortOrder: 3, isEnabled: false },
];

const weeklyPlan: ApiWeeklyPlan = {
  id: "week_1",
  weekStartDate: "2026-04-27",
  selections: [{ day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "meal_spaghetti" }],
};

function groceryItem(
  name: string,
  group: ApiGroceryListItem["group"],
  storeTags: string[],
): ApiGroceryListItem {
  return {
    name,
    group,
    storeTags,
    quantityLabels: [],
    usedInMeals: ["Spaghetti Night"],
    usedIn: [
      {
        day: "Monday",
        slotName: "Dinner",
        slotSlug: "dinner",
        mealName: "Spaghetti Night",
        mealId: "meal_spaghetti",
      },
    ],
  };
}

describe("getGrocerySlotOptions", () => {
  it("shows configured enabled meal slots even when the saved plan only uses dinner", () => {
    expect(getGrocerySlotOptions(planSlots, weeklyPlan).map((slot) => slot.name)).toEqual([
      "Breakfast",
      "Lunch",
      "Dinner",
    ]);
  });

  it("keeps a disabled saved slot visible so old saved plans can still be filtered", () => {
    const planWithDisabledSlot: ApiWeeklyPlan = {
      ...weeklyPlan,
      selections: [{ day: "Tuesday", slot: "Snack", slotSlug: "snack", mealId: "meal_snack" }],
    };

    expect(getGrocerySlotOptions(planSlots, planWithDisabledSlot).map((slot) => slot.name)).toEqual([
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snack",
    ]);
  });
});

describe("getGroceryStoreSections", () => {
  it("groups grocery items by store and then by ingredient group", () => {
    const sections = getGroceryStoreSections([
      groceryItem("Rice", "carb", ["Costco"]),
      groceryItem("Chicken", "protein", ["Costco"]),
      groceryItem("Apples", "fruit", ["Cub"]),
      groceryItem("Salt", "extras", []),
    ]);

    expect(sections.map((section) => section.storeName)).toEqual(["Costco", "Cub", "Unassigned store"]);
    expect(sections[0]?.groups.map((group) => group.group)).toEqual(["protein", "carb"]);
    expect(sections[0]?.groups[0]?.items.map((item) => item.name)).toEqual(["Chicken"]);
  });
});
