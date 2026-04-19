import { Router } from "express";

import { categoriesRouter } from "./categories.js";
import { mealsRouter } from "./meals.js";
import { weeklyPlansRouter } from "./weekly-plans.js";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/meals", mealsRouter);
apiRouter.use("/weekly-plans", weeklyPlansRouter);
