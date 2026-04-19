import { prisma } from "../config/prisma.js";

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
