import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("meal routes", () => {
  it("returns persisted meals from Prisma/Postgres", async () => {
    const app = createApp();
    const response = await request(app).get("/api/meals");

    expect(response.status).toBe(200);
    expect(response.body.meals.length).toBeGreaterThan(0);
    expect(response.body.meals.some((meal: { name: string }) => meal.name === "Chicken Quesadillas")).toBe(true);
  });

  it("creates and fetches a new meal", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();
    const createResponse = await request(app).post("/api/meals").send({
      name: `Test Rice Bowl ${uniqueSuffix}`,
      slug: `test-rice-bowl-${uniqueSuffix}`,
      categorySlug: "rice-bowls",
      costTier: "standard",
      kidFavorite: false,
      lowEffort: true,
      notes: "A test meal.",
      ingredients: [
        { name: `Rice ${uniqueSuffix}`, group: "carb", quantityLabel: "1 bag", storeTag: "Costco" },
        { name: `Chicken Thighs ${uniqueSuffix}`, group: "protein", quantityLabel: "2 pounds", storeTag: "Cub" },
      ],
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.meal.name).toContain("Test Rice Bowl");

    const fetchResponse = await request(app).get(`/api/meals/${createResponse.body.meal.id}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.meal.slug).toBe(`test-rice-bowl-${uniqueSuffix}`);
    expect(fetchResponse.body.meal.ingredients).toHaveLength(2);
  });

  it("prevents deleting a meal that is used in a saved weekly plan", async () => {
    const app = createApp();
    const mealsResponse = await request(app).get("/api/meals");
    const spaghettiNight = mealsResponse.body.meals.find((meal: { slug?: string }) => meal.slug === "spaghetti-night");

    await request(app).put("/api/weekly-plans/2026-05-04").send({
      selections: [{ day: "Monday", mealId: spaghettiNight.id }],
    });

    const deleteResponse = await request(app).delete(`/api/meals/${spaghettiNight.id}`);

    expect(deleteResponse.status).toBe(409);
  });
});
