import { Router } from "express";
import { z } from "zod";

import {
  createPlanSlot,
  deletePlanSlot,
  listPlanSlots,
  reorderPlanSlots,
  updatePlanSlot,
} from "../repositories/plan-slot-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";

export const planSlotsRouter = Router();

const planSlotSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sortOrder: z.number().int().nonnegative().optional(),
  isEnabled: z.boolean().optional(),
});

const reorderSchema = z.object({
  planSlotIds: z.array(z.string().min(1)).min(1),
});

const planSlotParamsSchema = z.object({
  planSlotId: z.string().min(1),
});

planSlotsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      planSlots: await listPlanSlots(),
    });
  }),
);

planSlotsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = planSlotSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Meal slot payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const planSlot = await createPlanSlot(parsed.data);
    response.status(201).json({ planSlot });
  }),
);

planSlotsRouter.put(
  "/reorder",
  asyncHandler(async (request, response) => {
    const parsed = reorderSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Meal slot reorder payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const planSlots = await reorderPlanSlots(parsed.data.planSlotIds);

    if (!planSlots) {
      throw new HttpError(400, "Meal slot reorder references an unknown slot.");
    }

    response.json({ planSlots });
  }),
);

planSlotsRouter.put(
  "/:planSlotId",
  asyncHandler(async (request, response) => {
    const params = planSlotParamsSchema.parse(request.params);
    const parsed = planSlotSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Meal slot payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const planSlot = await updatePlanSlot(params.planSlotId, parsed.data);

    if (!planSlot) {
      throw new HttpError(404, "Meal slot not found.");
    }

    response.json({ planSlot });
  }),
);

planSlotsRouter.delete(
  "/:planSlotId",
  asyncHandler(async (request, response) => {
    const params = planSlotParamsSchema.parse(request.params);
    const result = await deletePlanSlot(params.planSlotId);

    if (!result.deleted) {
      if (result.reason === "not_found") {
        throw new HttpError(404, "Meal slot not found.");
      }

      throw new HttpError(409, "Meal slot cannot be deleted because it is used by plans or category assignments.");
    }

    response.status(204).send();
  }),
);
