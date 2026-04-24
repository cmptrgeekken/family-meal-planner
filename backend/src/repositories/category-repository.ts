import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { MealCategoryRecord } from "../domain/models.js";
import { throwIfUniqueConstraintError } from "./prisma-error-utils.js";

type UpsertCategoryInput = {
  name: string;
  slug: string;
  iconId?: string | null;
  slotSlugs?: string[];
  weeklyMinCount?: number | null;
  weeklyMaxCount?: number | null;
};

const categoryInclude = {
  slotAssignments: {
    include: {
      planSlot: true,
    },
    orderBy: {
      planSlot: {
        sortOrder: "asc",
      },
    },
  },
  _count: {
    select: {
      meals: true,
    },
  },
} satisfies Prisma.CategoryInclude;

type CategoryWithSlots = {
  id: string;
  name: string;
  slug: string;
  iconId: string | null;
  weeklyMinCount: number | null;
  weeklyMaxCount: number | null;
  slotAssignments: Array<{ planSlot: { slug: string } }>;
  _count: { meals: number };
};

function mapCategory(category: CategoryWithSlots): MealCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    iconId: category.iconId ?? undefined,
    slotSlugs: category.slotAssignments.map((assignment) => assignment.planSlot.slug),
    weeklyMinCount: category.weeklyMinCount ?? undefined,
    weeklyMaxCount: category.weeklyMaxCount ?? undefined,
    mealCount: category._count.meals,
  };
}

async function getSlotConnectInput(slotSlugs: string[] | undefined) {
  const normalizedSlotSlugs = slotSlugs ?? ["dinner"];
  const planSlots = await prisma.planSlot.findMany({
    where: {
      slug: {
        in: normalizedSlotSlugs,
      },
    },
  });

  if (planSlots.length !== normalizedSlotSlugs.length) {
    return null;
  }

  return planSlots.map((planSlot) => ({
    planSlotId: planSlot.id,
  }));
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    include: categoryInclude,
    orderBy: {
      name: "asc",
    },
  });

  return categories.map(mapCategory);
}

export async function getCategoryById(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: categoryInclude,
  });

  return category ? mapCategory(category) : null;
}

export async function createCategory(input: UpsertCategoryInput) {
  const slotAssignments = await getSlotConnectInput(input.slotSlugs);

  if (!slotAssignments) {
    return null;
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        iconId: input.iconId ?? null,
        weeklyMinCount: input.weeklyMinCount ?? null,
        weeklyMaxCount: input.weeklyMaxCount ?? null,
        slotAssignments: {
          createMany: {
            data: slotAssignments,
          },
        },
      },
      include: categoryInclude,
    });

    return mapCategory(category);
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Category slug",
    });
  }
}

export async function updateCategory(categoryId: string, input: UpsertCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    return null;
  }

  const slotAssignments = await getSlotConnectInput(input.slotSlugs);

  if (!slotAssignments) {
    return null;
  }

  try {
    const category = await prisma.$transaction(async (tx) => {
      await tx.categoryPlanSlot.deleteMany({
        where: { categoryId },
      });

      return tx.category.update({
        where: { id: categoryId },
        data: {
          name: input.name,
          slug: input.slug,
          iconId: input.iconId ?? null,
          weeklyMinCount: input.weeklyMinCount ?? null,
          weeklyMaxCount: input.weeklyMaxCount ?? null,
          slotAssignments: {
            createMany: {
              data: slotAssignments,
            },
          },
        },
        include: categoryInclude,
      });
    });

    return mapCategory(category);
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Category slug",
    });
  }
}

export async function deleteCategory(categoryId: string, replacementCategoryId?: string) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      meals: {
        select: { id: true },
      },
    },
  });

  if (!existing) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existing.meals.length > 0) {
    if (!replacementCategoryId) {
      return { deleted: false, reason: "replacement_required" as const };
    }

    if (replacementCategoryId === categoryId) {
      return { deleted: false, reason: "invalid_replacement" as const };
    }

    const replacementCategory = await prisma.category.findUnique({
      where: { id: replacementCategoryId },
      select: { id: true },
    });

    if (!replacementCategory) {
      return { deleted: false, reason: "invalid_replacement" as const };
    }

    await prisma.$transaction([
      prisma.meal.updateMany({
        where: { categoryId },
        data: { categoryId: replacementCategoryId },
      }),
      prisma.category.delete({
        where: { id: categoryId },
      }),
    ]);

    return {
      deleted: true as const,
      migratedMealCount: existing.meals.length,
    };
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return { deleted: true as const, migratedMealCount: 0 };
}
