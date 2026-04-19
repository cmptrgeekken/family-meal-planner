import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("weekly plan routes", () => {
  it("does not persist a plan through the preview endpoint", async () => {
    const app = createApp();
    const weekStartDate = "2026-06-01";
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");

    const previewResponse = await request(app).post("/api/weekly-plans/preview").send({
      weekStartDate,
      selections: [{ day: "Monday", mealId: spaghettiNight.id }],
    });

    expect(previewResponse.status).toBe(200);
    expect(previewResponse.body.persisted).toBe(false);

    const fetchResponse = await request(app).get(`/api/weekly-plans/${weekStartDate}`);

    expect(fetchResponse.status).toBe(404);
  });

  it("persists and retrieves a weekly plan by week start date", async () => {
    const app = createApp();
    const weekStartDate = "2026-04-27";
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");
    const breakfastForDinner = mealsResponse.body.meals.find(
      (meal: { slug?: string }) => meal.slug === "breakfast-for-dinner",
    );

    const saveResponse = await request(app).put(`/api/weekly-plans/${weekStartDate}`).send({
      selections: [
        { day: "Monday", mealId: spaghettiNight.id },
        { day: "Tuesday", mealId: breakfastForDinner.id },
      ],
    });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.weeklyPlan.selections).toHaveLength(2);

    const fetchResponse = await request(app).get(`/api/weekly-plans/${weekStartDate}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.weeklyPlan.weekStartDate).toContain("2026-04-27");
    expect(fetchResponse.body.weeklyPlan.selections).toEqual([
      { day: "Monday", mealId: spaghettiNight.id },
      { day: "Tuesday", mealId: breakfastForDinner.id },
    ]);
  });

  it("lists recent weekly plans", async () => {
    const app = createApp();
    const response = await request(app).get("/api/weekly-plans?limit=5");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.weeklyPlans)).toBe(true);
    expect(response.body.weeklyPlans.length).toBeGreaterThan(0);
  });
});
