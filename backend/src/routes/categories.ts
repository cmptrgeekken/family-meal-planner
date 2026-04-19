import { Router } from "express";

import { listMealCategories } from "../services/meal-catalog.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", (_request, response) => {
  response.json({
    categories: listMealCategories(),
  });
});
