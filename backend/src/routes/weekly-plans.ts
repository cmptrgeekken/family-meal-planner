import { Router } from "express";
import { z } from "zod";

import { buildGroceryList } from "../domain/grocery.js";
import { weekdayNames } from "../domain/models.js";
import { normalizeWeeklyPlanSelections } from "../domain/plan-slots.js";
import { validateWeeklyPlan } from "../domain/planning.js";
import { listMeals } from "../repositories/meal-repository.js";
import { listPlanSlots } from "../repositories/plan-slot-repository.js";
import {
  getWeeklyPlanByWeekStartDate,
  listRecentWeeklyPlans,
  upsertWeeklyPlanPreview,
} from "../repositories/weekly-plan-repository.js";
import { asyncHandler } from "./async-handler.js";
import { HttpError } from "./http-error.js";
import { weekdayToIndex } from "../domain/weekdays.js";

const previewSchema = z.object({
  weekStartDate: z.string().min(1),
  selections: z.array(
    z.object({
      day: z.enum(weekdayNames),
      slot: z.string().min(1).optional(),
      slotSlug: z.string().min(1).optional(),
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

function hasBlockingValidationIssues(validationIssues: Array<{ code: string }>) {
  return validationIssues.some((issue) => issue.code !== "category_minimum_unmet");
}

async function assertKnownSlotSlugs(slotSlugs: string[]) {
  const planSlots = await listPlanSlots();
  const knownSlotSlugs = new Set(planSlots.map((planSlot) => planSlot.slug));
  const unknownSlotSlug = slotSlugs.find((slotSlug) => !knownSlotSlugs.has(slotSlug));

  if (unknownSlotSlug) {
    throw new HttpError(400, `Meal slot "${unknownSlotSlug}" does not exist.`);
  }
}

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
    const normalizedPreview = {
      ...preview,
      selections: normalizeWeeklyPlanSelections(preview.selections),
    };
    await assertKnownSlotSlugs(normalizedPreview.selections.map((selection) => selection.slotSlug));
    const meals = await listMeals();
    const validationIssues = validateWeeklyPlan(normalizedPreview, meals);
    const groceryList = buildGroceryList(normalizedPreview, meals);

    response.json({
      preview: normalizedPreview,
      validationIssues,
      groceryList,
      persisted: false,
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

    const weeklyPlan = {
      ...parsed.data,
      selections: normalizeWeeklyPlanSelections(parsed.data.selections),
    };
    await assertKnownSlotSlugs(weeklyPlan.selections.map((selection) => selection.slotSlug));
    const meals = await listMeals();
    const validationIssues = validateWeeklyPlan(weeklyPlan, meals);

    if (hasBlockingValidationIssues(validationIssues)) {
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
        slotSlug: selection.slotSlug,
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
