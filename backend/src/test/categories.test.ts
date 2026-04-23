import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("category routes", () => {
  it("creates, updates, fetches, and deletes an unused category", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();

    const createResponse = await request(app).post("/api/categories").send({
      name: `TEST__Category ${uniqueSuffix}`,
      slug: `test-artifact-category-${uniqueSuffix}`,
      iconId: "42",
      slotSlugs: ["breakfast", "dinner"],
      weeklyMinCount: 1,
      weeklyMaxCount: 3,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.category.iconId).toBe("42");
    expect(createResponse.body.category.slotSlugs).toEqual(["breakfast", "dinner"]);
    expect(createResponse.body.category.weeklyMinCount).toBe(1);
    expect(createResponse.body.category.weeklyMaxCount).toBe(3);

    const categoryId = createResponse.body.category.id;

    const updateResponse = await request(app).put(`/api/categories/${categoryId}`).send({
      name: `Updated TEST__Category ${uniqueSuffix}`,
      slug: `updated-test-artifact-category-${uniqueSuffix}`,
      iconId: "71",
      slotSlugs: ["lunch"],
      weeklyMinCount: null,
      weeklyMaxCount: 2,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.category.slug).toBe(`updated-test-artifact-category-${uniqueSuffix}`);
    expect(updateResponse.body.category.iconId).toBe("71");
    expect(updateResponse.body.category.slotSlugs).toEqual(["lunch"]);
    expect(updateResponse.body.category.weeklyMinCount).toBeUndefined();
    expect(updateResponse.body.category.weeklyMaxCount).toBe(2);

    const fetchResponse = await request(app).get(`/api/categories/${categoryId}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.category.name).toContain("Updated TEST__Category");
    expect(fetchResponse.body.category.iconId).toBe("71");
    expect(fetchResponse.body.category.slotSlugs).toEqual(["lunch"]);

    const deleteResponse = await request(app).delete(`/api/categories/${categoryId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("prevents deleting a category that is in use by meals", async () => {
    const app = createApp();
    const categoriesResponse = await request(app).get("/api/categories");
    const chickenCategory = categoriesResponse.body.categories.find(
      (category: { slug?: string }) => category.slug === "chicken-night",
    );

    const deleteResponse = await request(app).delete(`/api/categories/${chickenCategory.id}`);

    expect(deleteResponse.status).toBe(409);
  });

  it("returns a conflict when creating a duplicate category slug", async () => {
    const app = createApp();

    const response = await request(app).post("/api/categories").send({
      name: "Chicken Clone",
      slug: "chicken-night",
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("conflict");
    expect(response.body.field).toBe("Category slug");
  });

  it("rejects unknown category slot assignments and invalid weekly count ranges", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();

    const unknownSlotResponse = await request(app).post("/api/categories").send({
      name: `TEST__Unknown Slot ${uniqueSuffix}`,
      slug: `test-unknown-slot-${uniqueSuffix}`,
      slotSlugs: ["not-a-slot"],
    });

    expect(unknownSlotResponse.status).toBe(400);

    const invalidRangeResponse = await request(app).post("/api/categories").send({
      name: `TEST__Invalid Range ${uniqueSuffix}`,
      slug: `test-invalid-range-${uniqueSuffix}`,
      weeklyMinCount: 3,
      weeklyMaxCount: 1,
    });

    expect(invalidRangeResponse.status).toBe(400);
  });
});
