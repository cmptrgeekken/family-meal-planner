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
      name: `Test Store ${uniqueSuffix}`,
      slug: `test-store-${uniqueSuffix}`,
    });

    expect(createResponse.status).toBe(201);

    const storeTagId = createResponse.body.storeTag.id;

    const updateResponse = await request(app).put(`/api/store-tags/${storeTagId}`).send({
      name: `Updated Test Store ${uniqueSuffix}`,
      slug: `updated-test-store-${uniqueSuffix}`,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.storeTag.slug).toBe(`updated-test-store-${uniqueSuffix}`);

    const fetchResponse = await request(app).get(`/api/store-tags/${storeTagId}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.storeTag.name).toContain("Updated Test Store");

    const deleteResponse = await request(app).delete(`/api/store-tags/${storeTagId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("prevents deleting a store tag that is in use by ingredients", async () => {
    const app = createApp();
    const storeTagsResponse = await request(app).get("/api/store-tags");
    const costco = storeTagsResponse.body.storeTags.find((storeTag: { slug?: string }) => storeTag.slug === "costco");

    const deleteResponse = await request(app).delete(`/api/store-tags/${costco.id}`);

    expect(deleteResponse.status).toBe(409);
  });
});
