import { prisma } from "../config/prisma.js";
import type { StoreTagRecord } from "../domain/models.js";

type UpsertStoreTagInput = {
  name: string;
  slug: string;
};

function mapStoreTag(storeTag: { id: string; name: string; slug: string; _count: { ingredients: number } }): StoreTagRecord {
  return {
    id: storeTag.id,
    name: storeTag.name,
    slug: storeTag.slug,
    ingredientCount: storeTag._count.ingredients,
  };
}

export async function listStoreTags() {
  const storeTags = await prisma.storeTagOption.findMany({
    include: {
      _count: {
        select: {
          ingredients: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return storeTags.map(mapStoreTag);
}

export async function getStoreTagById(storeTagId: string) {
  const storeTag = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
    include: {
      _count: {
        select: {
          ingredients: true,
        },
      },
    },
  });

  return storeTag ? mapStoreTag(storeTag) : null;
}

export async function createStoreTag(input: UpsertStoreTagInput) {
  const storeTag = await prisma.storeTagOption.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
    include: {
      _count: {
        select: {
          ingredients: true,
        },
      },
    },
  });

  return mapStoreTag(storeTag);
}

export async function updateStoreTag(storeTagId: string, input: UpsertStoreTagInput) {
  const existing = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
  });

  if (!existing) {
    return null;
  }

  const storeTag = await prisma.storeTagOption.update({
    where: { id: storeTagId },
    data: {
      name: input.name,
      slug: input.slug,
    },
    include: {
      _count: {
        select: {
          ingredients: true,
        },
      },
    },
  });

  return mapStoreTag(storeTag);
}

export async function deleteStoreTag(storeTagId: string, replacementStoreTagId?: string, clearIngredients = false) {
  const existing = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
    include: {
      ingredients: {
        select: { id: true },
      },
    },
  });

  if (!existing) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existing.ingredients.length > 0) {
    if (replacementStoreTagId) {
      if (replacementStoreTagId === storeTagId) {
        return { deleted: false, reason: "invalid_replacement" as const };
      }

      const replacementStoreTag = await prisma.storeTagOption.findUnique({
        where: { id: replacementStoreTagId },
        select: { id: true },
      });

      if (!replacementStoreTag) {
        return { deleted: false, reason: "invalid_replacement" as const };
      }

      await prisma.$transaction([
        prisma.ingredient.updateMany({
          where: { storeTagId },
          data: { storeTagId: replacementStoreTagId },
        }),
        prisma.storeTagOption.delete({
          where: { id: storeTagId },
        }),
      ]);

      return {
        deleted: true as const,
        migratedIngredientCount: existing.ingredients.length,
        clearedIngredientCount: 0,
      };
    }

    if (clearIngredients) {
      await prisma.$transaction([
        prisma.ingredient.updateMany({
          where: { storeTagId },
          data: { storeTagId: null },
        }),
        prisma.storeTagOption.delete({
          where: { id: storeTagId },
        }),
      ]);

      return {
        deleted: true as const,
        migratedIngredientCount: 0,
        clearedIngredientCount: existing.ingredients.length,
      };
    }

    return { deleted: false, reason: "replacement_required" as const };
  }

  await prisma.storeTagOption.delete({
    where: { id: storeTagId },
  });

  return { deleted: true as const, migratedIngredientCount: 0, clearedIngredientCount: 0 };
}
