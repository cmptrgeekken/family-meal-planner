import { prisma } from "../config/prisma.js";
import type { PlanSlotRecord } from "../domain/models.js";
import { throwIfUniqueConstraintError } from "./prisma-error-utils.js";

type UpsertPlanSlotInput = {
  name: string;
  slug: string;
  sortOrder?: number;
  isEnabled?: boolean;
};

function mapPlanSlot(planSlot: PlanSlotRecord): PlanSlotRecord {
  return {
    id: planSlot.id,
    name: planSlot.name,
    slug: planSlot.slug,
    sortOrder: planSlot.sortOrder,
    isEnabled: planSlot.isEnabled,
  };
}

export async function listPlanSlots() {
  const planSlots = await prisma.planSlot.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return planSlots.map(mapPlanSlot);
}

export async function listEnabledPlanSlots() {
  const planSlots = await prisma.planSlot.findMany({
    where: { isEnabled: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return planSlots.map(mapPlanSlot);
}

export async function createPlanSlot(input: UpsertPlanSlotInput) {
  const sortOrder = input.sortOrder ?? (await prisma.planSlot.count());

  try {
    const planSlot = await prisma.planSlot.create({
      data: {
        name: input.name,
        slug: input.slug,
        sortOrder,
        isEnabled: input.isEnabled ?? true,
      },
    });

    return mapPlanSlot(planSlot);
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Meal slot slug",
    });
  }
}

export async function updatePlanSlot(planSlotId: string, input: UpsertPlanSlotInput) {
  const existing = await prisma.planSlot.findUnique({
    where: { id: planSlotId },
  });

  if (!existing) {
    return null;
  }

  try {
    const planSlot = await prisma.planSlot.update({
      where: { id: planSlotId },
      data: {
        name: input.name,
        slug: input.slug,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        isEnabled: input.isEnabled ?? existing.isEnabled,
      },
    });

    return mapPlanSlot(planSlot);
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Meal slot slug",
    });
  }
}

export async function reorderPlanSlots(planSlotIds: string[]) {
  const existingCount = await prisma.planSlot.count({
    where: {
      id: {
        in: planSlotIds,
      },
    },
  });

  if (existingCount !== planSlotIds.length) {
    return null;
  }

  await prisma.$transaction(
    planSlotIds.map((planSlotId, index) =>
      prisma.planSlot.update({
        where: { id: planSlotId },
        data: { sortOrder: index },
      }),
    ),
  );

  return listPlanSlots();
}

export async function deletePlanSlot(planSlotId: string) {
  const existing = await prisma.planSlot.findUnique({
    where: { id: planSlotId },
    include: {
      planMeals: {
        select: { id: true },
        take: 1,
      },
      categoryAssignments: {
        select: { categoryId: true },
        take: 1,
      },
    },
  });

  if (!existing) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existing.planMeals.length > 0 || existing.categoryAssignments.length > 0) {
    return { deleted: false, reason: "in_use" as const };
  }

  await prisma.planSlot.delete({
    where: { id: planSlotId },
  });

  return { deleted: true as const };
}
