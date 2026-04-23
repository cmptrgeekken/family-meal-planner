import { describe, expect, it } from "vitest";

import { buildGroceryList } from "../domain/grocery.js";
import type { Meal } from "../domain/models.js";

const meals: Meal[] = [
  {
    id: "spaghetti-night",
    name: "Spaghetti Night",
    category: "Pasta",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: false,
    ingredients: [
      { name: "Ground Beef", group: "protein", quantityLabel: "1 pound", storeTag: "Costco" },
      { name: "Spaghetti", group: "carb", quantityLabel: "1 box", storeTag: "Other" },
    ],
  },
  {
    id: "burger-bowls",
    name: "Burger Bowls",
    category: "Ground Meat",
    costTier: "premium",
    kidFavorite: false,
    lowEffort: false,
    ingredients: [
      { name: "Ground Beef", group: "protein", quantityLabel: "2 pounds", storeTag: "Costco" },
      { name: "Potatoes", group: "carb", quantityLabel: "1 bag", storeTag: "Costco" },
    ],
  },
];

describe("buildGroceryList", () => {
  it("deduplicates ingredients across selected meals", () => {
    const groceryList = buildGroceryList(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
          { day: "Tuesday", slot: "Dinner", slotSlug: "dinner", mealId: "burger-bowls" },
        ],
      },
      meals,
    );

    const groundBeef = groceryList.find((item) => item.name === "Ground Beef");

    expect(groundBeef).toBeDefined();
    expect(groundBeef?.usedInMeals).toEqual(["Spaghetti Night", "Burger Bowls"]);
    expect(groundBeef?.usedIn).toEqual([
      { day: "Monday", slotName: "Dinner", slotSlug: "dinner", mealName: "Spaghetti Night", mealId: "spaghetti-night" },
      { day: "Tuesday", slotName: "Dinner", slotSlug: "dinner", mealName: "Burger Bowls", mealId: "burger-bowls" },
    ]);
  });

  it("filters grocery output by selected slot slugs", () => {
    const groceryList = buildGroceryList(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "spaghetti-night" },
          { day: "Tuesday", slot: "Lunch", slotSlug: "lunch", mealId: "burger-bowls" },
        ],
      },
      meals,
      ["dinner"],
    );

    expect(groceryList.map((item) => item.name)).toEqual(["Spaghetti", "Ground Beef"]);
  });
});
