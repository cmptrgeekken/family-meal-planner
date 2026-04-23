import { Router } from "express";

import { categoriesRouter } from "./categories.js";
import { mealsRouter } from "./meals.js";
import { planSlotsRouter } from "./plan-slots.js";
import { storeTagsRouter } from "./store-tags.js";
import { weeklyPlansRouter } from "./weekly-plans.js";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/meals", mealsRouter);
apiRouter.use("/plan-slots", planSlotsRouter);
apiRouter.use("/store-tags", storeTagsRouter);
apiRouter.use("/weekly-plans", weeklyPlansRouter);
