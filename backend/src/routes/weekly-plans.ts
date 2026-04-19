import { Router } from "express";
import { z } from "zod";

import { buildGroceryList } from "../domain/grocery.js";
import { validateWeeklyPlan } from "../domain/planning.js";
import { listMeals } from "../repositories/meal-repository.js";
import {
  getWeeklyPlanByWeekStartDate,
  listRecentWeeklyPlans,
  upsertWeeklyPlanPreview,
} from "../repositories/weekly-plan-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";
import { weekdayNames } from "../domain/models.js";
import { weekdayToIndex } from "../domain/weekdays.js";

const previewSchema = z.object({
  weekStartDate: z.string().min(1),
  selections: z.array(
    z.object({
      day: z.enum(weekdayNames),
      mealId: z.string().min(1),
    }),
  ),
});

const weekParamSchema = z.object({
  weekStartDate: z.string().date(),
});

const recentPlansQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export const weeklyPlansRouter = Router();

weeklyPlansRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = recentPlansQuerySchema.parse(request.query);
    const weeklyPlans = await listRecentWeeklyPlans(query.limit);

    response.json({
      weeklyPlans,
    });
  }),
);

weeklyPlansRouter.get(
  "/:weekStartDate",
  asyncHandler(async (request, response) => {
    const params = weekParamSchema.parse(request.params);
    const weeklyPlan = await getWeeklyPlanByWeekStartDate(new Date(params.weekStartDate));

    if (!weeklyPlan) {
      throw new HttpError(404, "Weekly plan not found.");
    }

    const meals = await listMeals();
    const validationIssues = validateWeeklyPlan(weeklyPlan, meals);
    const groceryList = buildGroceryList(weeklyPlan, meals);

    response.json({
      weeklyPlan,
      validationIssues,
      groceryList,
    });
  }),
);

weeklyPlansRouter.post(
  "/preview",
  asyncHandler(async (request, response) => {
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
    const meals = await listMeals();
    const validationIssues = validateWeeklyPlan(preview, meals);
    const groceryList = buildGroceryList(preview, meals);

    if (validationIssues.length === 0) {
      await upsertWeeklyPlanPreview(
        new Date(preview.weekStartDate),
        preview.selections.map((selection) => ({
          mealId: selection.mealId,
          dayOfWeek: weekdayToIndex(selection.day),
        })),
      );
    }

    response.json({
      preview,
      validationIssues,
      groceryList,
    });
  }),
);

weeklyPlansRouter.put(
  "/:weekStartDate",
  asyncHandler(async (request, response) => {
    const params = weekParamSchema.parse(request.params);
    const parsed = previewSchema.safeParse({
      ...request.body,
      weekStartDate: params.weekStartDate,
    });

    if (!parsed.success) {
      response.status(400).json({
        error: "invalid_request",
        message: "Weekly plan payload is invalid.",
        details: parsed.error.flatten(),
      });
      return;
    }

    const weeklyPlan = parsed.data;
    const meals = await listMeals();
    const validationIssues = validateWeeklyPlan(weeklyPlan, meals);

    if (validationIssues.length > 0) {
      response.status(400).json({
        error: "invalid_weekly_plan",
        message: "Weekly plan violates one or more planning rules.",
        validationIssues,
      });
      return;
    }

    await upsertWeeklyPlanPreview(
      new Date(weeklyPlan.weekStartDate),
      weeklyPlan.selections.map((selection) => ({
        mealId: selection.mealId,
        dayOfWeek: weekdayToIndex(selection.day),
      })),
    );

    const savedWeeklyPlan = await getWeeklyPlanByWeekStartDate(new Date(weeklyPlan.weekStartDate));

    response.json({
      weeklyPlan: savedWeeklyPlan,
      validationIssues: [],
      groceryList: buildGroceryList(weeklyPlan, meals),
    });
  }),
);
