import { Router } from "express";
import { z } from "zod";

import {
  createStoreTag,
  deleteStoreTag,
  getStoreTagById,
  listStoreTags,
  updateStoreTag,
} from "../repositories/store-tag-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";

export const storeTagsRouter = Router();

const storeTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

const storeTagParamsSchema = z.object({
  storeTagId: z.string().min(1),
});

storeTagsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      storeTags: await listStoreTags(),
    });
  }),
);

storeTagsRouter.get(
  "/:storeTagId",
  asyncHandler(async (request, response) => {
    const params = storeTagParamsSchema.parse(request.params);
    const storeTag = await getStoreTagById(params.storeTagId);

    if (!storeTag) {
      throw new HttpError(404, "Store tag not found.");
    }

    response.json({ storeTag });
  }),
);

storeTagsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = storeTagSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Store tag payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const storeTag = await createStoreTag(parsed.data);
    response.status(201).json({ storeTag });
  }),
);

storeTagsRouter.put(
  "/:storeTagId",
  asyncHandler(async (request, response) => {
    const params = storeTagParamsSchema.parse(request.params);
    const parsed = storeTagSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Store tag payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const storeTag = await updateStoreTag(params.storeTagId, parsed.data);

    if (!storeTag) {
      throw new HttpError(404, "Store tag not found.");
    }

    response.json({ storeTag });
  }),
);

storeTagsRouter.delete(
  "/:storeTagId",
  asyncHandler(async (request, response) => {
    const params = storeTagParamsSchema.parse(request.params);
    const result = await deleteStoreTag(params.storeTagId);

    if (!result.deleted) {
      if (result.reason === "not_found") {
        throw new HttpError(404, "Store tag not found.");
      }

      throw new HttpError(409, "Store tag cannot be deleted because it is used by one or more ingredients.");
    }

    response.status(204).send();
  }),
);
