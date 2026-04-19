import { Router } from "express";
import { z } from "zod";

import { buildGroceryList } from "../domain/grocery.js";
import { validateWeeklyPlan } from "../domain/planning.js";
import { listMeals } from "../services/meal-catalog.js";

const previewSchema = z.object({
  weekStartDate: z.string().min(1),
  selections: z.array(
    z.object({
      day: z.string().min(1),
      mealId: z.string().min(1),
    }),
  ),
});

export const weeklyPlansRouter = Router();

weeklyPlansRouter.post("/preview", (request, response) => {
  const parsed = previewSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: "invalid_request",
      message: "Weekly plan preview payload is invalid.",
      details: parsed.error.flatten(),
    });
    return;
  }

  const preview = parsed.data;
  const meals = listMeals();
  const validationIssues = validateWeeklyPlan(preview, meals);
  const groceryList = buildGroceryList(preview, meals);

  response.json({
    preview,
    validationIssues,
    groceryList,
  });
});
