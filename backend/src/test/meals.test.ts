import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("GET /api/meals", () => {
  it("returns persisted meals from Prisma/Postgres", async () => {
    const app = createApp();
    const response = await request(app).get("/api/meals");

    expect(response.status).toBe(200);
    expect(response.body.meals.length).toBeGreaterThan(0);
    expect(response.body.meals.some((meal: { name: string }) => meal.name === "Chicken Quesadillas")).toBe(true);
  });
});
