import { Router } from "express";

import { listMealCategories } from "../repositories/meal-repository.js";
import { asyncHandler } from "./async-handler.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({
      categories: await listMealCategories(),
    });
  }),
);
