import { prisma } from "../config/prisma.js";
import type { WeeklyPlan } from "../domain/models.js";
import { indexToWeekday } from "../domain/weekdays.js";

export async function upsertWeeklyPlanPreview(weekStartDate: Date, selections: { dayOfWeek: number; mealId: string }[]) {
  const weeklyPlan = await prisma.weeklyPlan.upsert({
    where: { weekStartDate },
    update: {},
    create: { weekStartDate },
  });

  await prisma.weeklyPlanMeal.deleteMany({
    where: { weeklyPlanId: weeklyPlan.id },
  });

  if (selections.length > 0) {
    await prisma.weeklyPlanMeal.createMany({
      data: selections.map((selection) => ({
        weeklyPlanId: weeklyPlan.id,
        mealId: selection.mealId,
        dayOfWeek: selection.dayOfWeek,
      })),
    });
  }

  return weeklyPlan;
}

export async function getWeeklyPlanByWeekStartDate(weekStartDate: Date): Promise<WeeklyPlan | null> {
  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { weekStartDate },
    include: {
      meals: {
        include: {
          meal: true,
        },
        orderBy: {
          dayOfWeek: "asc",
        },
      },
    },
  });

  if (!weeklyPlan) {
    return null;
  }

  return {
    id: weeklyPlan.id,
    weekStartDate: weeklyPlan.weekStartDate.toISOString(),
    selections: weeklyPlan.meals.map((selection) => ({
      day: indexToWeekday(selection.dayOfWeek),
      mealId: selection.mealId,
    })),
  };
}

export async function listRecentWeeklyPlans(limit = 8): Promise<WeeklyPlan[]> {
  const weeklyPlans = await prisma.weeklyPlan.findMany({
    include: {
      meals: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
    },
    orderBy: {
      weekStartDate: "desc",
    },
    take: limit,
  });

  return weeklyPlans.map((weeklyPlan) => ({
    id: weeklyPlan.id,
    weekStartDate: weeklyPlan.weekStartDate.toISOString(),
    selections: weeklyPlan.meals.map((selection) => ({
      day: indexToWeekday(selection.dayOfWeek),
      mealId: selection.mealId,
    })),
  }));
}
