import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("weekly plan routes", () => {
  it("does not persist a plan through the preview endpoint", async () => {
    const app = createApp();
    const weekStartDate = "2099-06-01";
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");

    const previewResponse = await request(app).post("/api/weekly-plans/preview").send({
      weekStartDate,
      selections: [{ day: "Monday", mealId: spaghettiNight.id }],
    });

    expect(previewResponse.status).toBe(200);
    expect(previewResponse.body.persisted).toBe(false);
    expect(previewResponse.body.preview.selections[0].slot).toBe("Dinner");
    expect(previewResponse.body.preview.selections[0].slotSlug).toBe("dinner");

    const fetchResponse = await request(app).get(`/api/weekly-plans/${weekStartDate}`);

    expect(fetchResponse.status).toBe(404);
  });

  it("persists and retrieves a weekly plan by week start date", async () => {
    const app = createApp();
    const weekStartDate = "2099-04-27";
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
    expect(fetchResponse.body.weeklyPlan.weekStartDate).toContain("2099-04-27");
    expect(fetchResponse.body.weeklyPlan.selections).toEqual([
      { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: spaghettiNight.id },
      { day: "Tuesday", slot: "Dinner", slotSlug: "dinner", mealId: breakfastForDinner.id },
    ]);
  });

  it("allows multiple slots on the same day", async () => {
    const app = createApp();
    const weekStartDate = "2099-07-06";
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");
    const breakfastForDinner = mealsResponse.body.meals.find(
      (meal: { slug?: string }) => meal.slug === "breakfast-for-dinner",
    );

    const response = await request(app).put(`/api/weekly-plans/${weekStartDate}`).send({
      selections: [
        { day: "Monday", slotSlug: "breakfast", mealId: breakfastForDinner.id },
        { day: "Monday", slotSlug: "dinner", mealId: spaghettiNight.id },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.body.weeklyPlan.selections).toEqual([
      { day: "Monday", slot: "Breakfast", slotSlug: "breakfast", mealId: breakfastForDinner.id },
      { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: spaghettiNight.id },
    ]);
  });

  it("filters saved grocery output by meal slot", async () => {
    const app = createApp();
    const weekStartDate = "2099-07-13";
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");
    const breakfastForDinner = mealsResponse.body.meals.find(
      (meal: { slug?: string }) => meal.slug === "breakfast-for-dinner",
    );

    const saveResponse = await request(app).put(`/api/weekly-plans/${weekStartDate}`).send({
      selections: [
        { day: "Monday", slotSlug: "breakfast", mealId: breakfastForDinner.id },
        { day: "Monday", slotSlug: "dinner", mealId: spaghettiNight.id },
      ],
    });
    const fetchResponse = await request(app).get(`/api/weekly-plans/${weekStartDate}?slotSlugs=breakfast`);

    expect(saveResponse.status).toBe(200);
    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.groceryList.map((item: { name: string }) => item.name)).toContain("Eggs");
    expect(fetchResponse.body.groceryList.map((item: { name: string }) => item.name)).not.toContain("Spaghetti");
  });

  it("rejects two selections for the same day and slot", async () => {
    const app = createApp();
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");
    const breakfastForDinner = mealsResponse.body.meals.find(
      (meal: { slug?: string }) => meal.slug === "breakfast-for-dinner",
    );

    const response = await request(app).put("/api/weekly-plans/2099-06-08").send({
      selections: [
        { day: "Monday", mealId: spaghettiNight.id },
        { day: "Monday", mealId: breakfastForDinner.id },
      ],
    });

    expect(response.status).toBe(400);
    expect(response.body.validationIssues.some((issue: { code: string }) => issue.code === "duplicate_day_slot")).toBe(
      true,
    );
  });

  it("lists recent weekly plans", async () => {
    const app = createApp();
    const response = await request(app).get("/api/weekly-plans?limit=5");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.weeklyPlans)).toBe(true);
    expect(response.body.weeklyPlans.length).toBeGreaterThan(0);
  });
});
