import prismaClient from "@prisma/client";

const { CostTier, IngredientType, PrismaClient } = prismaClient;

const prisma = new PrismaClient();

const planSlots = [
  { name: "Breakfast", slug: "breakfast", sortOrder: 0, isEnabled: true },
  { name: "Lunch", slug: "lunch", sortOrder: 1, isEnabled: true },
  { name: "Dinner", slug: "dinner", sortOrder: 2, isEnabled: true },
];

const categories = [
  { name: "Pasta Night", slug: "pasta-night", legacySlug: "pasta", iconId: "168", slotSlugs: ["dinner"] },
  { name: "Rice Bowls", slug: "rice-bowls", iconId: "115", slotSlugs: ["dinner"] },
  { name: "Grill Night", slug: "grill-night", legacySlug: "ground-meat", iconId: "ai-grill", slotSlugs: ["dinner"] },
  { name: "Chicken Night", slug: "chicken-night", legacySlug: "chicken", iconId: "160", slotSlugs: ["dinner"] },
  { name: "Taco Night", slug: "taco-night", iconId: "77", slotSlugs: ["dinner"] },
  { name: "Sandwich Night", slug: "sandwich-night", legacySlug: "sandwich-snack", iconId: "ai-blt", slotSlugs: ["dinner"] },
  { name: "Snack Plate", slug: "snack-plate", iconId: "ai-snackplate", slotSlugs: ["dinner"] },
  { name: "Breakfast Dinner", slug: "breakfast-dinner", legacySlug: "breakfast", iconId: "71", slotSlugs: ["dinner"] },
  { name: "Pizza Night", slug: "pizza-night", iconId: "178", slotSlugs: ["dinner"] },
  { name: "Easy Dinner", slug: "easy-dinner", legacySlug: "fun-zero-cook", iconId: "ai-takeout", slotSlugs: ["dinner"] },
  { name: "One-Pot Meal", slug: "one-pot-meal", iconId: "117", slotSlugs: ["dinner"] },
  {
    name: "Special Dinner",
    slug: "special-dinner",
    legacySlug: "premium",
    iconId: "ai-steak",
    slotSlugs: ["dinner"],
    weeklyMaxCount: 1,
  },
];

const storeTags = [
  { name: "Costco", slug: "costco" },
  { name: "Cub", slug: "cub" },
  { name: "Other", slug: "other" },
];

const meals = [
  {
    name: "Spaghetti Night",
    slug: "spaghetti-night",
    categorySlug: "pasta-night",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: false,
    notes: "A reliable pasta-night default. Serve with salad or roasted vegetables for a parent upgrade.",
    ingredients: [
      { name: "Spaghetti", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 box" },
      { name: "Ground Beef", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pound" },
      { name: "Marinara Sauce", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 jar" },
      { name: "Romaine", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1 head" },
    ],
  },
  {
    name: "Teriyaki Rice Bowls",
    slug: "teriyaki-rice-bowls",
    categorySlug: "rice-bowls",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: false,
    notes: "Use frozen broccoli and bottled sauce on a tired night.",
    ingredients: [
      { name: "Rice", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "2 cups" },
      { name: "Chicken Thighs", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "2 pounds" },
      { name: "Broccoli", type: IngredientType.VEG, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Teriyaki Sauce", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bottle" },
    ],
  },
  {
    name: "Burger Night",
    slug: "burger-night",
    categorySlug: "grill-night",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: false,
    notes: "Hamburgers or hot dogs with simple fruit and chips keeps grill night easy.",
    ingredients: [
      { name: "Burger Patties", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "6 patties" },
      { name: "Hamburger Buns", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 pack" },
      { name: "Lettuce", type: IngredientType.VEG, storeTagSlug: "other", quantityLabel: "1 head" },
      { name: "Pickles", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 jar" },
    ],
  },
  {
    name: "Chicken Nugget Night",
    slug: "chicken-nugget-night",
    categorySlug: "chicken-night",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Add carrot sticks, fruit, or a bag salad to make nuggets a full dinner.",
    ingredients: [
      { name: "Chicken Nuggets", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Frozen Fries", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 bag" },
      { name: "Baby Carrots", type: IngredientType.VEG, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Apples", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "4 apples" },
    ],
  },
  {
    name: "Chicken Quesadillas",
    slug: "chicken-quesadillas",
    categorySlug: "taco-night",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "A tortilla-meal fallback. Add peppers and black beans for a parent upgrade.",
    ingredients: [
      { name: "Chicken", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Tortillas", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 package" },
      { name: "Shredded Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Bell Peppers", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "2 peppers" },
    ],
  },
  {
    name: "BLT Sandwiches",
    slug: "blt-sandwiches",
    categorySlug: "sandwich-night",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Use deli meat instead of bacon when speed matters more than crispiness.",
    ingredients: [
      { name: "Bread", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 loaf" },
      { name: "Bacon", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Tomatoes", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "2 tomatoes" },
      { name: "Lettuce", type: IngredientType.VEG, storeTagSlug: "other", quantityLabel: "1 head" },
    ],
  },
  {
    name: "Snack Plate Dinner",
    slug: "snack-plate-dinner",
    categorySlug: "snack-plate",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "A no-cook fallback: protein, fruit, crunchy carb, and a dip.",
    ingredients: [
      { name: "Deli Turkey", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Crackers", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 box" },
      { name: "Cheddar Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 block" },
      { name: "Grapes", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 bag" },
    ],
  },
  {
    name: "Breakfast for Dinner",
    slug: "breakfast-for-dinner",
    categorySlug: "breakfast-dinner",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Pancakes, eggs, waffles, or French toast. Add berries or yogurt to round it out.",
    ingredients: [
      { name: "Eggs", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 dozen" },
      { name: "Pancake Mix", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 box" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 clamshell" },
      { name: "Maple Syrup", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bottle" },
    ],
  },
  {
    name: "Pizza Night",
    slug: "pizza-night",
    categorySlug: "pizza-night",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Frozen pizza, delivery, or flatbreads all fit here. Add raw veggies or fruit on the side.",
    ingredients: [
      { name: "Pizza", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 pizzas" },
      { name: "Mozzarella", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Pepperoni", type: IngredientType.PROTEIN, storeTagSlug: "other", quantityLabel: "1 pack" },
      { name: "Cucumbers", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "2 cucumbers" },
    ],
  },
  {
    name: "Frozen Dumpling Dinner",
    slug: "frozen-dumpling-dinner",
    categorySlug: "easy-dinner",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Quick heat-and-eat dinner. Add microwave rice or steamed edamame if needed.",
    ingredients: [
      { name: "Frozen Dumplings", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Microwave Rice", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "2 pouches" },
      { name: "Edamame", type: IngredientType.VEG, storeTagSlug: "other", quantityLabel: "1 bag" },
      { name: "Soy Sauce", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bottle" },
    ],
  },
  {
    name: "One-Pot Pasta",
    slug: "one-pot-pasta",
    categorySlug: "one-pot-meal",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: false,
    notes: "A single-pot pasta mix that can absorb vegetables, sausage, or leftover chicken.",
    ingredients: [
      { name: "Pasta", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 box" },
      { name: "Chicken Sausage", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Spinach", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1 bag" },
      { name: "Chicken Broth", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 carton" },
    ],
  },
  {
    name: "Steak Dinner",
    slug: "steak-dinner",
    categorySlug: "special-dinner",
    costTier: CostTier.PREMIUM,
    kidFavorite: false,
    lowEffort: false,
    notes: "A nicer dinner bucket for steak, salmon, or other premium mains.",
    ingredients: [
      { name: "Steak", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1.5 pounds" },
      { name: "Potatoes", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Asparagus", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1 bunch" },
      { name: "Butter", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 pack" },
    ],
  },
];

async function upsertCategory(category) {
  const { legacySlug, slotSlugs = ["dinner"], ...categoryData } = category;

  if (legacySlug && legacySlug !== category.slug) {
    const [targetCategory, legacyCategory] = await Promise.all([
      prisma.category.findUnique({ where: { slug: category.slug } }),
      prisma.category.findUnique({ where: { slug: legacySlug } }),
    ]);

    if (legacyCategory && !targetCategory) {
      await prisma.category.update({
        where: { id: legacyCategory.id },
        data: { slug: category.slug },
      });
    } else if (legacyCategory && targetCategory) {
      await prisma.meal.updateMany({
        where: { categoryId: legacyCategory.id },
        data: { categoryId: targetCategory.id },
      });
      await prisma.category.delete({ where: { id: legacyCategory.id } });
    }
  }

  const createdCategory = await prisma.category.upsert({
    where: { slug: category.slug },
    update: {
      name: category.name,
      iconId: category.iconId,
      weeklyMinCount: category.weeklyMinCount ?? null,
      weeklyMaxCount: category.weeklyMaxCount ?? null,
    },
    create: categoryData,
  });

  const planSlots = await prisma.planSlot.findMany({
    where: {
      slug: {
        in: slotSlugs,
      },
    },
  });

  await prisma.categoryPlanSlot.deleteMany({
    where: { categoryId: createdCategory.id },
  });

  if (planSlots.length > 0) {
    await prisma.categoryPlanSlot.createMany({
      data: planSlots.map((planSlot) => ({
        categoryId: createdCategory.id,
        planSlotId: planSlot.id,
      })),
      skipDuplicates: true,
    });
  }
}

async function seed() {
  for (const planSlot of planSlots) {
    await prisma.planSlot.upsert({
      where: { slug: planSlot.slug },
      update: {
        name: planSlot.name,
        sortOrder: planSlot.sortOrder,
        isEnabled: planSlot.isEnabled,
      },
      create: planSlot,
    });
  }

  for (const category of categories) {
    await upsertCategory(category);
  }

  for (const storeTag of storeTags) {
    await prisma.storeTagOption.upsert({
      where: { slug: storeTag.slug },
      update: { name: storeTag.name },
      create: storeTag,
    });
  }

  for (const meal of meals) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: meal.categorySlug },
    });

    const createdMeal = await prisma.meal.upsert({
      where: { slug: meal.slug },
      update: {
        name: meal.name,
        categoryId: category.id,
        costTier: meal.costTier,
        kidFavorite: meal.kidFavorite,
        lowEffort: meal.lowEffort,
        notes: meal.notes,
      },
      create: {
        name: meal.name,
        slug: meal.slug,
        categoryId: category.id,
        costTier: meal.costTier,
        kidFavorite: meal.kidFavorite,
        lowEffort: meal.lowEffort,
        notes: meal.notes,
      },
    });

    await prisma.mealIngredient.deleteMany({
      where: { mealId: createdMeal.id },
    });

    for (const ingredient of meal.ingredients) {
      const storeTag = await prisma.storeTagOption.findUnique({
        where: { slug: ingredient.storeTagSlug },
      });

      const savedIngredient = await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        update: {
          type: ingredient.type,
          storeTagId: storeTag?.id ?? null,
        },
        create: {
          name: ingredient.name,
          type: ingredient.type,
          storeTagId: storeTag?.id ?? null,
        },
      });

      await prisma.mealIngredient.create({
        data: {
          mealId: createdMeal.id,
          ingredientId: savedIngredient.id,
          quantityLabel: ingredient.quantityLabel,
        },
      });
    }
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
