import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("store tag routes", () => {
  it("lists persisted store tags", async () => {
    const app = createApp();
    const response = await request(app).get("/api/store-tags");

    expect(response.status).toBe(200);
    expect(response.body.storeTags.some((storeTag: { slug?: string }) => storeTag.slug === "costco")).toBe(true);
  });

  it("creates, updates, fetches, and deletes an unused store tag", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();

    const createResponse = await request(app).post("/api/store-tags").send({
      name: `TEST__Store ${uniqueSuffix}`,
      slug: `test-artifact-store-${uniqueSuffix}`,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.storeTag.ingredientCount).toBe(0);

    const storeTagId = createResponse.body.storeTag.id;

    const updateResponse = await request(app).put(`/api/store-tags/${storeTagId}`).send({
      name: `Updated TEST__Store ${uniqueSuffix}`,
      slug: `updated-test-artifact-store-${uniqueSuffix}`,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.storeTag.slug).toBe(`updated-test-artifact-store-${uniqueSuffix}`);

    const fetchResponse = await request(app).get(`/api/store-tags/${storeTagId}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.storeTag.name).toContain("Updated TEST__Store");

    const deleteResponse = await request(app).delete(`/api/store-tags/${storeTagId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("requires reassignment or clearing when deleting a store tag that is in use by ingredients", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();
    const sourceStoreTagResponse = await request(app).post("/api/store-tags").send({
      name: `TEST__Store Source ${uniqueSuffix}`,
      slug: `test-artifact-store-source-${uniqueSuffix}`,
    });
    const sourceStoreTag = sourceStoreTagResponse.body.storeTag;

    await request(app).post("/api/meals").send({
      name: `Test Artifact Meal ${uniqueSuffix}`,
      slug: `test-artifact-meal-${uniqueSuffix}`,
      categorySlug: "pasta-night",
      costTier: "budget",
      kidFavorite: true,
      lowEffort: true,
      ingredients: [{ name: `TEST__Rice ${uniqueSuffix}`, group: "carb", quantityLabel: "1 box", storeTagSlug: sourceStoreTag.slug }],
    });

    const deleteResponse = await request(app).delete(`/api/store-tags/${sourceStoreTag.id}`);

    expect(deleteResponse.status).toBe(409);
    expect(deleteResponse.body.message).toMatch(/choose a replacement tag or clear/i);
  });

  it("migrates ingredient store tags before deleting", async () => {
    const app = createApp();
    const uniqueSuffix = `${Date.now()}-migrate`;
    const sourceStoreTagResponse = await request(app).post("/api/store-tags").send({
      name: `TEST__Store Source ${uniqueSuffix}`,
      slug: `test-artifact-store-source-${uniqueSuffix}`,
    });
    const replacementStoreTagResponse = await request(app).post("/api/store-tags").send({
      name: `TEST__Store Target ${uniqueSuffix}`,
      slug: `test-artifact-store-target-${uniqueSuffix}`,
    });
    const sourceStoreTag = sourceStoreTagResponse.body.storeTag;
    const replacementStoreTag = replacementStoreTagResponse.body.storeTag;

    await request(app).post("/api/meals").send({
      name: `Test Artifact Meal ${uniqueSuffix}`,
      slug: `test-artifact-meal-${uniqueSuffix}`,
      categorySlug: "pasta-night",
      costTier: "budget",
      kidFavorite: true,
      lowEffort: true,
      ingredients: [
        { name: `TEST__Chicken Thighs ${uniqueSuffix}`, group: "protein", quantityLabel: "1 pack", storeTagSlug: sourceStoreTag.slug },
      ],
    });

    const deleteResponse = await request(app).delete(
      `/api/store-tags/${sourceStoreTag.id}?replacementStoreTagId=${replacementStoreTag.id}`,
    );

    expect(deleteResponse.status).toBe(204);

    const mealsResponse = await request(app).get(`/api/meals?storeTagSlug=${replacementStoreTag.slug}`);
    expect(
      mealsResponse.body.meals.some((meal: { name?: string }) => meal.name === `Test Artifact Meal ${uniqueSuffix}`),
    ).toBe(true);
  });

  it("can clear ingredient store tags before deleting", async () => {
    const app = createApp();
    const uniqueSuffix = `${Date.now()}-clear`;
    const sourceStoreTagResponse = await request(app).post("/api/store-tags").send({
      name: `TEST__Store Source ${uniqueSuffix}`,
      slug: `test-artifact-store-source-${uniqueSuffix}`,
    });
    const sourceStoreTag = sourceStoreTagResponse.body.storeTag;

    await request(app).post("/api/meals").send({
      name: `Test Artifact Meal ${uniqueSuffix}`,
      slug: `test-artifact-meal-${uniqueSuffix}`,
      categorySlug: "pasta-night",
      costTier: "budget",
      kidFavorite: true,
      lowEffort: true,
      ingredients: [{ name: `TEST__Fruit ${uniqueSuffix}`, group: "fruit", quantityLabel: "1 bag", storeTagSlug: sourceStoreTag.slug }],
    });

    const deleteResponse = await request(app).delete(`/api/store-tags/${sourceStoreTag.id}?clearIngredients=true`);

    expect(deleteResponse.status).toBe(204);

    const mealsResponse = await request(app).get("/api/meals");
    const migratedMeal = mealsResponse.body.meals.find((meal: { name?: string }) => meal.name === `Test Artifact Meal ${uniqueSuffix}`);
    expect(migratedMeal.ingredients.some((ingredient: { name?: string; storeTagSlug?: string }) => (
      ingredient.name === `TEST__Fruit ${uniqueSuffix}` && ingredient.storeTagSlug == null
    ))).toBe(true);
  });
});
