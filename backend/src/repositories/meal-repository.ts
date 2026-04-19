import { IngredientType, StoreTag, type Prisma } from "@prisma/client";

import type { GroceryGroup, Meal, MealCategory, StoreTag as DomainStoreTag } from "../domain/models.js";
import { prisma } from "../config/prisma.js";

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
    name: record.name,
    category: record.category.name as MealCategory,
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

export async function listMealCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((category) => category.name);
}
