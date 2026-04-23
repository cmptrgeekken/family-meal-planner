import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";

describe("plan slot routes", () => {
  it("lists default meal slots in configured order", async () => {
    const app = createApp();
    const response = await request(app).get("/api/plan-slots");

    expect(response.status).toBe(200);
    expect(response.body.planSlots.map((slot: { slug: string }) => slot.slug)).toEqual(
      expect.arrayContaining(["breakfast", "lunch", "dinner"]),
    );
    expect(response.body.planSlots[0].slug).toBe("breakfast");
  });

  it("creates, updates, reorders, and deletes an unused meal slot", async () => {
    const app = createApp();
    const uniqueSuffix = Date.now().toString();

    const createResponse = await request(app).post("/api/plan-slots").send({
      name: `TEST__Snack ${uniqueSuffix}`,
      slug: `test-snack-${uniqueSuffix}`,
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.planSlot.isEnabled).toBe(true);

    const planSlotId = createResponse.body.planSlot.id;
    const updateResponse = await request(app).put(`/api/plan-slots/${planSlotId}`).send({
      name: `Updated TEST__Snack ${uniqueSuffix}`,
      slug: `updated-test-snack-${uniqueSuffix}`,
      isEnabled: false,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.planSlot.slug).toBe(`updated-test-snack-${uniqueSuffix}`);
    expect(updateResponse.body.planSlot.isEnabled).toBe(false);

    const slotsResponse = await request(app).get("/api/plan-slots");
    const planSlotIds = [
      planSlotId,
      ...slotsResponse.body.planSlots
        .map((slot: { id: string }) => slot.id)
        .filter((slotId: string) => slotId !== planSlotId),
    ];

    const reorderResponse = await request(app).put("/api/plan-slots/reorder").send({ planSlotIds });

    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body.planSlots[0].id).toBe(planSlotId);

    const deleteResponse = await request(app).delete(`/api/plan-slots/${planSlotId}`);

    expect(deleteResponse.status).toBe(204);
  });

  it("prevents deleting a slot that is assigned to categories", async () => {
    const app = createApp();
    const slotsResponse = await request(app).get("/api/plan-slots");
    const dinner = slotsResponse.body.planSlots.find((slot: { slug: string }) => slot.slug === "dinner");

    const deleteResponse = await request(app).delete(`/api/plan-slots/${dinner.id}`);

    expect(deleteResponse.status).toBe(409);
  });
});
