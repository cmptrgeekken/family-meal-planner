import { Router } from "express";

import { listMeals } from "../services/meal-catalog.js";

export const mealsRouter = Router();

mealsRouter.get("/", (_request, response) => {
  response.json({
    meals: listMeals(),
  });
});
