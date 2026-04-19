import { Router } from "express";
import { z } from "zod";

import {
  createMeal,
  deleteMeal,
  getMealById,
  listMeals,
  updateMeal,
} from "../repositories/meal-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";

export const mealsRouter = Router();

const mealParamsSchema = z.object({
  mealId: z.string().min(1),
});

const mealListQuerySchema = z.object({
  categorySlug: z.string().min(1).optional(),
  storeTagSlug: z.string().min(1).optional(),
  kidFavorite: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  lowEffort: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  group: z.enum(["protein", "carb", "veg", "fruit", "extras"]),
  storeTag: z.string().min(1).optional(),
  storeTagSlug: z.string().min(1).optional(),
  quantityLabel: z.string().min(1).optional(),
});

const mealSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categorySlug: z.string().min(1),
  costTier: z.enum(["budget", "standard", "premium"]),
  kidFavorite: z.boolean(),
  lowEffort: z.boolean(),
  notes: z.string().min(1).optional(),
  ingredients: z.array(ingredientSchema).min(1),
});

mealsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = mealListQuerySchema.parse(request.query);
    response.json({
      meals: await listMeals(query),
    });
  }),
);

mealsRouter.get(
  "/:mealId",
  asyncHandler(async (request, response) => {
    const params = mealParamsSchema.parse(request.params);
    const meal = await getMealById(params.mealId);

    if (!meal) {
      throw new HttpError(404, "Meal not found.");
    }

    response.json({ meal });
  }),
);

mealsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = mealSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Meal payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const meal = await createMeal(parsed.data);

    if (!meal) {
      throw new HttpError(400, "Category does not exist.");
    }

    response.status(201).json({ meal });
  }),
);

mealsRouter.put(
  "/:mealId",
  asyncHandler(async (request, response) => {
    const params = mealParamsSchema.parse(request.params);
    const parsed = mealSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Meal payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const meal = await updateMeal(params.mealId, parsed.data);

    if (!meal) {
      throw new HttpError(404, "Meal or category not found.");
    }

    response.json({ meal });
  }),
);

mealsRouter.delete(
  "/:mealId",
  asyncHandler(async (request, response) => {
    const params = mealParamsSchema.parse(request.params);
    const result = await deleteMeal(params.mealId);

    if (!result.deleted) {
      if (result.reason === "not_found") {
        throw new HttpError(404, "Meal not found.");
      }

      throw new HttpError(409, "Meal cannot be deleted because it is already used in a saved weekly plan.");
    }

    response.status(204).send();
  }),
);
