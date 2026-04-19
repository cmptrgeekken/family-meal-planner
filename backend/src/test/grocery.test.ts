import { describe, expect, it } from "vitest";

import { buildGroceryList } from "../domain/grocery.js";
import { listMeals } from "../services/meal-catalog.js";

describe("buildGroceryList", () => {
  it("deduplicates ingredients across selected meals", () => {
    const meals = listMeals();
    const groceryList = buildGroceryList(
      {
        weekStartDate: "2026-04-20",
        selections: [
          { day: "Monday", mealId: "spaghetti-night" },
          { day: "Tuesday", mealId: "burger-bowls" },
        ],
      },
      meals,
    );

    const groundBeef = groceryList.find((item) => item.name === "Ground Beef");

    expect(groundBeef).toBeDefined();
    expect(groundBeef?.usedInMeals).toEqual(["Spaghetti Night", "Burger Bowls"]);
  });
});
