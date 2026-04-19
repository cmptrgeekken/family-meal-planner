import { prisma } from "../config/prisma.js";
import type { MealCategoryRecord } from "../domain/models.js";

type UpsertCategoryInput = {
  name: string;
  slug: string;
};

function mapCategory(category: { id: string; name: string; slug: string }): MealCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return categories.map(mapCategory);
}

export async function getCategoryById(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  return category ? mapCategory(category) : null;
}

export async function createCategory(input: UpsertCategoryInput) {
  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
  });

  return mapCategory(category);
}

export async function updateCategory(categoryId: string, input: UpsertCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    return null;
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      slug: input.slug,
    },
  });

  return mapCategory(category);
}

export async function deleteCategory(categoryId: string) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      meals: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!existing) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existing.meals.length > 0) {
    return { deleted: false, reason: "in_use" as const };
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return { deleted: true as const };
}
