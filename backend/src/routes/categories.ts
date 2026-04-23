import { Router } from "express";
import { z } from "zod";

import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../repositories/category-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";

export const categoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  iconId: z.string().min(1).nullable().optional(),
  slotSlugs: z.array(z.string().min(1)).optional(),
  weeklyMinCount: z.number().int().nonnegative().nullable().optional(),
  weeklyMaxCount: z.number().int().nonnegative().nullable().optional(),
}).refine(
  (category) =>
    category.weeklyMinCount == null ||
    category.weeklyMaxCount == null ||
    category.weeklyMinCount <= category.weeklyMaxCount,
  {
    message: "Weekly minimum cannot be greater than weekly maximum.",
    path: ["weeklyMinCount"],
  },
);

const categoryParamsSchema = z.object({
  categoryId: z.string().min(1),
});

categoriesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      categories: await listCategories(),
    });
  }),
);

categoriesRouter.get(
  "/:categoryId",
  asyncHandler(async (request, response) => {
    const params = categoryParamsSchema.parse(request.params);
    const category = await getCategoryById(params.categoryId);

    if (!category) {
      throw new HttpError(404, "Category not found.");
    }

    response.json({ category });
  }),
);

categoriesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = categorySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Category payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const category = await createCategory(parsed.data);

    if (!category) {
      throw new HttpError(400, "Category references an unknown meal slot.");
    }

    response.status(201).json({ category });
  }),
);

categoriesRouter.put(
  "/:categoryId",
  asyncHandler(async (request, response) => {
    const params = categoryParamsSchema.parse(request.params);
    const parsed = categorySchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Category payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const category = await updateCategory(params.categoryId, parsed.data);

    if (!category) {
      throw new HttpError(404, "Category not found or references an unknown meal slot.");
    }

    response.json({ category });
  }),
);

categoriesRouter.delete(
  "/:categoryId",
  asyncHandler(async (request, response) => {
    const params = categoryParamsSchema.parse(request.params);
    const result = await deleteCategory(params.categoryId);

    if (!result.deleted) {
      if (result.reason === "not_found") {
        throw new HttpError(404, "Category not found.");
      }

      throw new HttpError(409, "Category cannot be deleted because it is used by one or more meals.");
    }

    response.status(204).send();
  }),
);
