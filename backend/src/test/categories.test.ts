import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("category routes", () => {
  it("creates, updates, fetches, and deletes an unused category", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();

    const createResponse = await request(app).post("/api/categories").send({
      name: `Test Category ${uniqueSuffix}`,
      slug: `test-category-${uniqueSuffix}`,
    });

    expect(createResponse.status).toBe(201);

    const categoryId = createResponse.body.category.id;

    const updateResponse = await request(app).put(`/api/categories/${categoryId}`).send({
      name: `Updated Test Category ${uniqueSuffix}`,
      slug: `updated-test-category-${uniqueSuffix}`,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.category.slug).toBe(`updated-test-category-${uniqueSuffix}`);

    const fetchResponse = await request(app).get(`/api/categories/${categoryId}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.category.name).toContain("Updated Test Category");

    const deleteResponse = await request(app).delete(`/api/categories/${categoryId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("prevents deleting a category that is in use by meals", async () => {
    const app = createApp();
    const categoriesResponse = await request(app).get("/api/categories");
    const chickenCategory = categoriesResponse.body.categories.find((category: { slug?: string }) => category.slug === "chicken");

    const deleteResponse = await request(app).delete(`/api/categories/${chickenCategory.id}`);

    expect(deleteResponse.status).toBe(409);
  });

  it("returns a conflict when creating a duplicate category slug", async () => {
    const app = createApp();

    const response = await request(app).post("/api/categories").send({
      name: "Chicken Clone",
      slug: "chicken",
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("conflict");
    expect(response.body.field).toBe("Category slug");
  });
});
