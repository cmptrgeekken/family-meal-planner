import { prisma } from "../config/prisma.js";
import { type WeeklyPlan } from "../domain/models.js";
import { indexToWeekday } from "../domain/weekdays.js";

type WeeklyPlanSelectionPersistenceInput = {
  dayOfWeek: number;
  mealId: string;
  slotSlug: string;
};

export async function upsertWeeklyPlanPreview(weekStartDate: Date, selections: WeeklyPlanSelectionPersistenceInput[]) {
  const weeklyPlan = await prisma.weeklyPlan.upsert({
    where: { weekStartDate },
    update: {},
    create: { weekStartDate },
  });

  await prisma.weeklyPlanMeal.deleteMany({
    where: { weeklyPlanId: weeklyPlan.id },
  });

  if (selections.length > 0) {
    const planSlots = await prisma.planSlot.findMany({
      where: {
        slug: {
          in: [...new Set(selections.map((selection) => selection.slotSlug))],
        },
      },
    });
    const planSlotIdBySlug = new Map(planSlots.map((planSlot) => [planSlot.slug, planSlot.id]));

    await prisma.weeklyPlanMeal.createMany({
      data: selections.map((selection) => {
        const planSlotId = planSlotIdBySlug.get(selection.slotSlug);

        if (!planSlotId) {
          throw new Error(`Unknown plan slot "${selection.slotSlug}".`);
        }

        return {
          weeklyPlanId: weeklyPlan.id,
          mealId: selection.mealId,
          dayOfWeek: selection.dayOfWeek,
          planSlotId,
        };
      }),
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
          planSlot: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { planSlot: { sortOrder: "asc" } }],
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
      slot: selection.planSlot.name,
      slotSlug: selection.planSlot.slug,
      mealId: selection.mealId,
    })),
  };
}

export async function listRecentWeeklyPlans(limit = 8): Promise<WeeklyPlan[]> {
  const weeklyPlans = await prisma.weeklyPlan.findMany({
    include: {
      meals: {
        include: {
          planSlot: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { planSlot: { sortOrder: "asc" } }],
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
      slot: selection.planSlot.name,
      slotSlug: selection.planSlot.slug,
      mealId: selection.mealId,
    })),
  }));
}
