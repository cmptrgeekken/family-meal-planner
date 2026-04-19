import { Router } from "express";

import { listMeals } from "../repositories/meal-repository.js";
import { asyncHandler } from "./async-handler.js";

export const mealsRouter = Router();

mealsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      meals: await listMeals(),
    });
  }),
);
