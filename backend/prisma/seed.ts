import { PrismaClient, CostTier, IngredientType, StoreTag } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Pasta", slug: "pasta" },
  { name: "Rice/Bowls", slug: "rice-bowls" },
  { name: "Breakfast", slug: "breakfast" },
  { name: "Sandwich/Snack", slug: "sandwich-snack" },
  { name: "Chicken", slug: "chicken" },
  { name: "Ground Meat", slug: "ground-meat" },
  { name: "Premium", slug: "premium" },
  { name: "Fun/Zero-Cook", slug: "fun-zero-cook" },
];

const meals = [
  {
    name: "Chicken Quesadillas",
    slug: "chicken-quesadillas",
    categorySlug: "chicken",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Add peppers and black beans for a parent upgrade.",
    ingredients: [
      { name: "Chicken", type: IngredientType.PROTEIN, storeTag: StoreTag.COSTCO, quantityLabel: "1 pack" },
      { name: "Tortillas", type: IngredientType.CARB, storeTag: StoreTag.OTHER, quantityLabel: "1 package" },
      { name: "Shredded Cheese", type: IngredientType.EXTRA, storeTag: StoreTag.COSTCO, quantityLabel: "1 bag" },
      { name: "Bell Peppers", type: IngredientType.VEG, storeTag: StoreTag.CUB, quantityLabel: "2 peppers" },
    ],
  },
  {
    name: "Spaghetti Night",
    slug: "spaghetti-night",
    categorySlug: "pasta",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: false,
    notes: "Serve with a quick salad on the side.",
    ingredients: [
      { name: "Spaghetti", type: IngredientType.CARB, storeTag: StoreTag.OTHER, quantityLabel: "1 box" },
      { name: "Ground Beef", type: IngredientType.PROTEIN, storeTag: StoreTag.COSTCO, quantityLabel: "1 pound" },
      { name: "Marinara Sauce", type: IngredientType.EXTRA, storeTag: StoreTag.OTHER, quantityLabel: "1 jar" },
      { name: "Romaine", type: IngredientType.VEG, storeTag: StoreTag.CUB, quantityLabel: "1 head" },
    ],
  },
  {
    name: "Breakfast for Dinner",
    slug: "breakfast-for-dinner",
    categorySlug: "breakfast",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Add berries or yogurt to round it out.",
    ingredients: [
      { name: "Eggs", type: IngredientType.PROTEIN, storeTag: StoreTag.COSTCO, quantityLabel: "1 dozen" },
      { name: "Bread", type: IngredientType.CARB, storeTag: StoreTag.OTHER, quantityLabel: "1 loaf" },
      { name: "Berries", type: IngredientType.FRUIT, storeTag: StoreTag.CUB, quantityLabel: "1 clamshell" },
    ],
  },
  {
    name: "Burger Bowls",
    slug: "burger-bowls",
    categorySlug: "ground-meat",
    costTier: CostTier.PREMIUM,
    kidFavorite: false,
    lowEffort: false,
    notes: "Use air fryer potatoes for an easier version.",
    ingredients: [
      { name: "Ground Beef", type: IngredientType.PROTEIN, storeTag: StoreTag.COSTCO, quantityLabel: "2 pounds" },
      { name: "Potatoes", type: IngredientType.CARB, storeTag: StoreTag.COSTCO, quantityLabel: "1 bag" },
      { name: "Lettuce", type: IngredientType.VEG, storeTag: StoreTag.OTHER, quantityLabel: "1 head" },
      { name: "Pickles", type: IngredientType.EXTRA, storeTag: StoreTag.OTHER, quantityLabel: "1 jar" },
    ],
  },
];

async function seed() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
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
      const savedIngredient = await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        update: {
          type: ingredient.type,
          storeTag: ingredient.storeTag,
        },
        create: {
          name: ingredient.name,
          type: ingredient.type,
          storeTag: ingredient.storeTag,
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
