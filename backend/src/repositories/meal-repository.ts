import { CostTier, IngredientType, StoreTag, type Prisma } from "@prisma/client";

import type {
  CostTier as DomainCostTier,
  GroceryGroup,
  Meal,
  MealCategory,
  MealIngredient,
  StoreTag as DomainStoreTag,
} from "../domain/models.js";
import { prisma } from "../config/prisma.js";
import { throwIfUniqueConstraintError } from "./prisma-error-utils.js";

const mealInclude = {
  category: true,
  ingredients: {
    include: {
      ingredient: true,
    },
  },
} satisfies Prisma.MealInclude;

type MealRecord = Prisma.MealGetPayload<{
  include: typeof mealInclude;
}>;

function mapIngredientType(type: IngredientType): GroceryGroup {
  switch (type) {
    case IngredientType.PROTEIN:
      return "protein";
    case IngredientType.CARB:
      return "carb";
    case IngredientType.VEG:
      return "veg";
    case IngredientType.FRUIT:
      return "fruit";
    case IngredientType.EXTRA:
      return "extras";
  }
}

function mapStoreTag(tag: StoreTag): DomainStoreTag {
  switch (tag) {
    case StoreTag.COSTCO:
      return "Costco";
    case StoreTag.CUB:
      return "Cub";
    case StoreTag.OTHER:
      return "Other";
  }
}

function mapCostTier(tier: MealRecord["costTier"]): Meal["costTier"] {
  switch (tier) {
    case "BUDGET":
      return "budget";
    case "STANDARD":
      return "standard";
    case "PREMIUM":
      return "premium";
  }
}

function mapMeal(record: MealRecord): Meal {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category.name as MealCategory,
    categorySlug: record.category.slug,
    costTier: mapCostTier(record.costTier),
    kidFavorite: record.kidFavorite,
    lowEffort: record.lowEffort,
    notes: record.notes ?? undefined,
    ingredients: record.ingredients.map((item) => ({
      name: item.ingredient.name,
      group: mapIngredientType(item.ingredient.type),
      storeTag: mapStoreTag(item.ingredient.storeTag),
      quantityLabel: item.quantityLabel ?? undefined,
    })),
  };
}

export async function listMeals() {
  const meals = await prisma.meal.findMany({
    include: mealInclude,
    orderBy: {
      name: "asc",
    },
  });

  return meals.map(mapMeal);
}

export async function getMealById(mealId: string) {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: mealInclude,
  });

  return meal ? mapMeal(meal) : null;
}

export async function getMealBySlug(slug: string) {
  const meal = await prisma.meal.findUnique({
    where: { slug },
    include: mealInclude,
  });

  return meal ? mapMeal(meal) : null;
}

type UpsertMealInput = {
  name: string;
  slug: string;
  categorySlug: string;
  costTier: DomainCostTier;
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: MealIngredient[];
};

function mapDomainCostTier(tier: DomainCostTier) {
  switch (tier) {
    case "budget":
      return CostTier.BUDGET;
    case "standard":
      return CostTier.STANDARD;
    case "premium":
      return CostTier.PREMIUM;
  }
}

function mapDomainGroup(group: MealIngredient["group"]) {
  switch (group) {
    case "protein":
      return IngredientType.PROTEIN;
    case "carb":
      return IngredientType.CARB;
    case "veg":
      return IngredientType.VEG;
    case "fruit":
      return IngredientType.FRUIT;
    case "extras":
      return IngredientType.EXTRA;
  }
}

function mapDomainStoreTag(tag?: DomainStoreTag) {
  switch (tag) {
    case "Costco":
      return StoreTag.COSTCO;
    case "Cub":
      return StoreTag.CUB;
    case "Other":
    case undefined:
      return StoreTag.OTHER;
  }
}

async function syncMealIngredients(tx: Prisma.TransactionClient, mealId: string, ingredients: MealIngredient[]) {
  await tx.mealIngredient.deleteMany({
    where: { mealId },
  });

  for (const ingredient of ingredients) {
    const savedIngredient = await tx.ingredient.upsert({
      where: { name: ingredient.name },
      update: {
        type: mapDomainGroup(ingredient.group),
        storeTag: mapDomainStoreTag(ingredient.storeTag),
      },
      create: {
        name: ingredient.name,
        type: mapDomainGroup(ingredient.group),
        storeTag: mapDomainStoreTag(ingredient.storeTag),
      },
    });

    await tx.mealIngredient.create({
      data: {
        mealId,
        ingredientId: savedIngredient.id,
        quantityLabel: ingredient.quantityLabel,
      },
    });
  }
}

export async function createMeal(input: UpsertMealInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { slug: input.categorySlug },
      });

      if (!category) {
        return null;
      }

      const meal = await tx.meal.create({
        data: {
          name: input.name,
          slug: input.slug,
          categoryId: category.id,
          costTier: mapDomainCostTier(input.costTier),
          kidFavorite: input.kidFavorite,
          lowEffort: input.lowEffort,
          notes: input.notes,
        },
        include: mealInclude,
      });

      await syncMealIngredients(tx, meal.id, input.ingredients);

      const savedMeal = await tx.meal.findUniqueOrThrow({
        where: { id: meal.id },
        include: mealInclude,
      });

      return mapMeal(savedMeal);
    });
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Meal slug",
    });
  }
}

export async function updateMeal(mealId: string, input: UpsertMealInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingMeal = await tx.meal.findUnique({
        where: { id: mealId },
      });

      if (!existingMeal) {
        return null;
      }

      const category = await tx.category.findUnique({
        where: { slug: input.categorySlug },
      });

      if (!category) {
        return null;
      }

      await tx.meal.update({
        where: { id: mealId },
        data: {
          name: input.name,
          slug: input.slug,
          categoryId: category.id,
          costTier: mapDomainCostTier(input.costTier),
          kidFavorite: input.kidFavorite,
          lowEffort: input.lowEffort,
          notes: input.notes,
        },
      });

      await syncMealIngredients(tx, mealId, input.ingredients);

      const savedMeal = await tx.meal.findUniqueOrThrow({
        where: { id: mealId },
        include: mealInclude,
      });

      return mapMeal(savedMeal);
    });
  } catch (error) {
    throwIfUniqueConstraintError(error, {
      slug: "Meal slug",
    });
  }
}

export async function deleteMeal(mealId: string) {
  const existingMeal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: {
      planMeals: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!existingMeal) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existingMeal.planMeals.length > 0) {
    return { deleted: false, reason: "in_use" as const };
  }

  await prisma.meal.delete({
    where: { id: mealId },
  });

  return { deleted: true as const };
}
