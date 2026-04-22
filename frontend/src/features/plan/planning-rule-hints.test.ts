import { describe, expect, it } from "vitest";

import { getPlannerRuleHints, type PlannerSelections } from "./planning-rule-hints";
import type { ApiMeal } from "../shared/api";

function emptySelections(): PlannerSelections {
  return {
    Monday: "",
    Tuesday: "",
    Wednesday: "",
    Thursday: "",
    Friday: "",
    Saturday: "",
    Sunday: "",
  };
}

function meal(id: string, name: string, costTier: ApiMeal["costTier"]): ApiMeal {
  return {
    id,
    name,
    costTier,
    slug: id,
    category: "Dinner",
    categorySlug: "dinner",
    kidFavorite: false,
    lowEffort: false,
    ingredients: [],
  };
}

describe("getPlannerRuleHints", () => {
  it("flags duplicate meals on each affected day", () => {
    const selections = {
      ...emptySelections(),
      Monday: "meal_tacos",
      Thursday: "meal_tacos",
    };
    const hints = getPlannerRuleHints(selections, new Map([["meal_tacos", meal("meal_tacos", "Tacos", "standard")]]));

    expect(hints.summary).toEqual(["Tacos is planned 2 times; the current limit is once per week."]);
    expect(hints.byDay.Monday).toEqual(["Repeat limit: also planned on Thursday."]);
    expect(hints.byDay.Thursday).toEqual(["Repeat limit: also planned on Monday."]);
  });

  it("flags premium limit conflicts across premium selections", () => {
    const selections = {
      ...emptySelections(),
      Friday: "meal_steak",
      Saturday: "meal_sushi",
    };
    const hints = getPlannerRuleHints(
      selections,
      new Map([
        ["meal_steak", meal("meal_steak", "Steak", "premium")],
        ["meal_sushi", meal("meal_sushi", "Sushi", "premium")],
      ]),
    );

    expect(hints.summary).toEqual([
      "Premium limit: 2 premium dinners selected; the current limit is one per week.",
    ]);
    expect(hints.byDay.Friday).toEqual(["Premium limit: choose only one premium dinner this week."]);
    expect(hints.byDay.Saturday).toEqual(["Premium limit: choose only one premium dinner this week."]);
  });

  it("returns no hints for an empty or valid week", () => {
    const hints = getPlannerRuleHints(emptySelections(), new Map());

    expect(hints.summary).toEqual([]);
    expect(Object.values(hints.byDay).every((messages) => messages.length === 0)).toBe(true);
  });
});
