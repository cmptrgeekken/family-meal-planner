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
  { name: "Classic Sandwich", slug: "classic-sandwich", iconId: "ai-blt", slotSlugs: ["lunch"] },
  { name: "Bagel Lunch", slug: "bagel-lunch", iconId: "73", slotSlugs: ["lunch"] },
  { name: "Cheese & Crackers Box", slug: "cheese-crackers-box", iconId: "152", slotSlugs: ["lunch"] },
  { name: "Chicken Bites", slug: "chicken-bites", iconId: "160", slotSlugs: ["lunch"] },
  { name: "Hot Dog Lunch", slug: "hot-dog-lunch", iconId: "162", slotSlugs: ["lunch"] },
  { name: "Pasta Lunch", slug: "pasta-lunch", iconId: "168", slotSlugs: ["lunch"] },
  { name: "Lunch Rice Bowl", slug: "lunch-rice-bowl", iconId: "115", slotSlugs: ["lunch"] },
  { name: "Wrap Lunch", slug: "wrap-lunch", iconId: "581", slotSlugs: ["lunch"] },
  { name: "Pizza Lunch", slug: "pizza-lunch", iconId: "178", slotSlugs: ["lunch"] },
  { name: "Egg-Free Protein Box", slug: "egg-free-protein-box", iconId: "522", slotSlugs: ["lunch"] },
  { name: "Breakfast Lunch", slug: "breakfast-lunch", iconId: "44", slotSlugs: ["lunch"] },
  { name: "Snack Box", slug: "snack-box", iconId: "547", slotSlugs: ["lunch"] },
  { name: "Pancake Stack", slug: "pancake-stack", iconId: "71", slotSlugs: ["breakfast"] },
  { name: "Bagel Bar", slug: "bagel-bar", iconId: "73", slotSlugs: ["breakfast"] },
  { name: "Cereal Bowl", slug: "cereal-bowl", iconId: "256", slotSlugs: ["breakfast"] },
  { name: "Fruit & Yogurt", slug: "fruit-yogurt", iconId: "369", slotSlugs: ["breakfast"] },
  { name: "Breakfast Sandwich", slug: "breakfast-sandwich", iconId: "79", slotSlugs: ["breakfast"] },
  { name: "Breakfast Wrap", slug: "breakfast-wrap", iconId: "188", slotSlugs: ["breakfast"] },
  { name: "Breakfast Plate", slug: "breakfast-plate", iconId: "150", slotSlugs: ["breakfast"] },
  { name: "Toast & Toppings", slug: "toast-toppings", iconId: "79", slotSlugs: ["breakfast"] },
  { name: "Freezer Breakfast", slug: "freezer-breakfast", iconId: "44", slotSlugs: ["breakfast"] },
  { name: "Smoothie & Fruit", slug: "smoothie-fruit", iconId: "224", slotSlugs: ["breakfast"] },
  { name: "Snack Breakfast", slug: "snack-breakfast", iconId: "170", slotSlugs: ["breakfast"] },
  { name: "Treat Breakfast", slug: "treat-breakfast", iconId: "36", slotSlugs: ["breakfast"] },
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
  {
    name: "Turkey & Cheese Sandwich",
    slug: "turkey-cheese-sandwich",
    categorySlug: "classic-sandwich",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Reliable lunch-box base with protein, bread, and easy fruit or veggie sides.",
    ingredients: [
      { name: "Sandwich Bread", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 slices" },
      { name: "Deli Turkey", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "4 slices" },
      { name: "Cheddar Slices", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "2 slices" },
      { name: "Apple Slices", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 apple" },
    ],
  },
  {
    name: "Bagel Turkey Lunch",
    slug: "bagel-turkey-lunch",
    categorySlug: "bagel-lunch",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Bagel plus cream cheese, deli meat, or cheese for a sturdier sandwich alternative.",
    ingredients: [
      { name: "Bagels", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Cream Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 tub" },
      { name: "Deli Ham", type: IngredientType.PROTEIN, storeTagSlug: "other", quantityLabel: "1 pack" },
      { name: "Cucumber Slices", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1 cucumber" },
    ],
  },
  {
    name: "DIY Lunchable Box",
    slug: "diy-lunchable-box",
    categorySlug: "cheese-crackers-box",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Cheese, crackers, and meat in separate compartments for an easy no-sandwich lunch.",
    ingredients: [
      { name: "Crackers", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 sleeve" },
      { name: "Cheese Cubes", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 cup" },
      { name: "Salami Slices", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "8 slices" },
      { name: "Grapes", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 handful" },
    ],
  },
  {
    name: "Chicken Bite Lunch",
    slug: "chicken-bite-lunch",
    categorySlug: "chicken-bites",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Works hot in a thermos or cold with dip depending on the day.",
    ingredients: [
      { name: "Chicken Nuggets", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "8 pieces" },
      { name: "Pretzels", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 handful" },
      { name: "Baby Carrots", type: IngredientType.VEG, storeTagSlug: "costco", quantityLabel: "1 handful" },
      { name: "Ranch Dip", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 cup" },
    ],
  },
  {
    name: "Sliced Hot Dog Lunch",
    slug: "sliced-hot-dog-lunch",
    categorySlug: "hot-dog-lunch",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "A kid-loved protein option with simple sides.",
    ingredients: [
      { name: "Hot Dogs", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "2 hot dogs" },
      { name: "Hot Dog Buns", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 buns" },
      { name: "Ketchup", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bottle" },
      { name: "Apple Slices", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 apple" },
    ],
  },
  {
    name: "Buttered Noodles Lunch",
    slug: "buttered-noodles-lunch",
    categorySlug: "pasta-lunch",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Cold pasta, buttered noodles, or pasta salad with an easy protein add-on.",
    ingredients: [
      { name: "Pasta", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 cup cooked" },
      { name: "Butter", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 pat" },
      { name: "Parmesan", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "2 tablespoons" },
      { name: "Chicken Chunks", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1/2 cup" },
    ],
  },
  {
    name: "Soy Chicken Rice Bowl",
    slug: "soy-chicken-rice-bowl",
    categorySlug: "lunch-rice-bowl",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Rice plus soy sauce and chicken for a familiar lunch bowl.",
    ingredients: [
      { name: "Rice", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 cup cooked" },
      { name: "Chicken Chunks", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1/2 cup" },
      { name: "Soy Sauce", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bottle" },
      { name: "Edamame", type: IngredientType.VEG, storeTagSlug: "other", quantityLabel: "1/2 cup" },
    ],
  },
  {
    name: "Turkey Cheese Wrap",
    slug: "turkey-cheese-wrap",
    categorySlug: "wrap-lunch",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "A tortilla-based sandwich upgrade that packs neatly.",
    ingredients: [
      { name: "Tortillas", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 tortilla" },
      { name: "Deli Turkey", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "4 slices" },
      { name: "Cheddar Slices", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "2 slices" },
      { name: "Bell Peppers", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1/2 pepper" },
    ],
  },
  {
    name: "Mini Pizza Lunch",
    slug: "mini-pizza-lunch",
    categorySlug: "pizza-lunch",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Leftover pizza or a mini pizza with cheese as the easy protein anchor.",
    ingredients: [
      { name: "Mini Pizza Crusts", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 crusts" },
      { name: "Pizza Sauce", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 jar" },
      { name: "Mozzarella", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1/2 cup" },
      { name: "Pepperoni", type: IngredientType.PROTEIN, storeTagSlug: "other", quantityLabel: "10 slices" },
    ],
  },
  {
    name: "No-Sandwich Protein Box",
    slug: "no-sandwich-protein-box",
    categorySlug: "egg-free-protein-box",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Cheese, deli meat, yogurt, and fruit when sandwiches are not it.",
    ingredients: [
      { name: "Cheese Cubes", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 cup" },
      { name: "Deli Turkey", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "4 slices" },
      { name: "Yogurt Cup", type: IngredientType.PROTEIN, storeTagSlug: "cub", quantityLabel: "1 cup" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 handful" },
    ],
  },
  {
    name: "Waffle Sausage Lunch",
    slug: "waffle-sausage-lunch",
    categorySlug: "breakfast-lunch",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Breakfast-for-lunch variety with waffles and sausage or bacon.",
    ingredients: [
      { name: "Frozen Waffles", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "2 waffles" },
      { name: "Sausage Links", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "3 links" },
      { name: "Maple Syrup", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bottle" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 handful" },
    ],
  },
  {
    name: "Flexible Snack Box",
    slug: "flexible-snack-box",
    categorySlug: "snack-box",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "A fallback mix of cheese, crackers, meat, fruit, and veggies.",
    ingredients: [
      { name: "Crackers", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 handful" },
      { name: "Cheddar Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 ounce" },
      { name: "Deli Ham", type: IngredientType.PROTEIN, storeTagSlug: "other", quantityLabel: "4 slices" },
      { name: "Baby Carrots", type: IngredientType.VEG, storeTagSlug: "costco", quantityLabel: "1 handful" },
    ],
  },
  {
    name: "Pancakes and Berries",
    slug: "pancakes-and-berries",
    categorySlug: "pancake-stack",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Core fun breakfast bucket for pancakes, waffles, or French toast.",
    ingredients: [
      { name: "Pancake Mix", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 box" },
      { name: "Maple Syrup", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bottle" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 clamshell" },
      { name: "Sausage Links", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
    ],
  },
  {
    name: "Bagel Cream Cheese Bar",
    slug: "bagel-cream-cheese-bar",
    categorySlug: "bagel-bar",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Bagels with cream cheese, lox, cheese, or deli meat.",
    ingredients: [
      { name: "Bagels", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Cream Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 tub" },
      { name: "Smoked Salmon", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Cucumber Slices", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1 cucumber" },
    ],
  },
  {
    name: "Cereal and Milk",
    slug: "cereal-and-milk",
    categorySlug: "cereal-bowl",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Cereal, granola, and milk for fast mornings.",
    ingredients: [
      { name: "Cereal", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 box" },
      { name: "Milk", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 gallon" },
      { name: "Bananas", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 bunch" },
      { name: "Granola", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bag" },
    ],
  },
  {
    name: "Yogurt Berry Bowl",
    slug: "yogurt-berry-bowl",
    categorySlug: "fruit-yogurt",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Fruit-heavy breakfast with yogurt for protein.",
    ingredients: [
      { name: "Greek Yogurt", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 tub" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 clamshell" },
      { name: "Granola", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bag" },
      { name: "Honey", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 bottle" },
    ],
  },
  {
    name: "Toast Breakfast Sandwich",
    slug: "toast-breakfast-sandwich",
    categorySlug: "breakfast-sandwich",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Bread-based breakfast sandwich with egg optional, not required.",
    ingredients: [
      { name: "Sandwich Bread", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 slices" },
      { name: "Cheddar Slices", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 slice" },
      { name: "Sausage Patties", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 patty" },
      { name: "Apple Slices", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 apple" },
    ],
  },
  {
    name: "Cheese Sausage Breakfast Wrap",
    slug: "cheese-sausage-breakfast-wrap",
    categorySlug: "breakfast-wrap",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Tortilla breakfast with fillings; eggs are optional, cheese and meat work fine.",
    ingredients: [
      { name: "Tortillas", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 tortilla" },
      { name: "Sausage Crumbles", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1/2 cup" },
      { name: "Shredded Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1/2 cup" },
      { name: "Bell Peppers", type: IngredientType.VEG, storeTagSlug: "cub", quantityLabel: "1/2 pepper" },
    ],
  },
  {
    name: "Bacon Toast Plate",
    slug: "bacon-toast-plate",
    categorySlug: "breakfast-plate",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: false,
    notes: "Bacon, sausage, toast, fruit, and simple sides without making eggs the headline.",
    ingredients: [
      { name: "Bacon", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Toast Bread", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "4 slices" },
      { name: "Butter", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 pat" },
      { name: "Orange Slices", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "2 oranges" },
    ],
  },
  {
    name: "Peanut Butter Toast",
    slug: "peanut-butter-toast",
    categorySlug: "toast-toppings",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Toast with butter, jam, peanut butter, or other quick toppings.",
    ingredients: [
      { name: "Toast Bread", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "2 slices" },
      { name: "Peanut Butter", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 jar" },
      { name: "Jam", type: IngredientType.EXTRA, storeTagSlug: "other", quantityLabel: "1 jar" },
      { name: "Bananas", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 bunch" },
    ],
  },
  {
    name: "Toaster Waffles",
    slug: "toaster-waffles",
    categorySlug: "freezer-breakfast",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Frozen waffles or toaster items for very fast mornings.",
    ingredients: [
      { name: "Frozen Waffles", type: IngredientType.CARB, storeTagSlug: "costco", quantityLabel: "1 box" },
      { name: "Maple Syrup", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 bottle" },
      { name: "Yogurt Cup", type: IngredientType.PROTEIN, storeTagSlug: "cub", quantityLabel: "2 cups" },
      { name: "Berries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 handful" },
    ],
  },
  {
    name: "Berry Banana Smoothie",
    slug: "berry-banana-smoothie",
    categorySlug: "smoothie-fruit",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Smoothies plus fruit combos for lighter mornings.",
    ingredients: [
      { name: "Frozen Berries", type: IngredientType.FRUIT, storeTagSlug: "costco", quantityLabel: "1 bag" },
      { name: "Bananas", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 bunch" },
      { name: "Greek Yogurt", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 tub" },
      { name: "Milk", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 gallon" },
    ],
  },
  {
    name: "Grab-and-Go Breakfast Box",
    slug: "grab-and-go-breakfast-box",
    categorySlug: "snack-breakfast",
    costTier: CostTier.BUDGET,
    kidFavorite: true,
    lowEffort: true,
    notes: "Cheese, fruit, crackers, and other quick combos when the morning is moving fast.",
    ingredients: [
      { name: "Cheddar Cheese", type: IngredientType.EXTRA, storeTagSlug: "costco", quantityLabel: "1 ounce" },
      { name: "Crackers", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "1 handful" },
      { name: "Apple Slices", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 apple" },
      { name: "Yogurt Cup", type: IngredientType.PROTEIN, storeTagSlug: "cub", quantityLabel: "1 cup" },
    ],
  },
  {
    name: "Muffin Treat Breakfast",
    slug: "muffin-treat-breakfast",
    categorySlug: "treat-breakfast",
    costTier: CostTier.STANDARD,
    kidFavorite: true,
    lowEffort: true,
    notes: "Muffins, pastries, or special-day breakfast that plays the same role as pizza night.",
    ingredients: [
      { name: "Muffins", type: IngredientType.CARB, storeTagSlug: "other", quantityLabel: "4 muffins" },
      { name: "Milk", type: IngredientType.PROTEIN, storeTagSlug: "costco", quantityLabel: "1 gallon" },
      { name: "Strawberries", type: IngredientType.FRUIT, storeTagSlug: "cub", quantityLabel: "1 clamshell" },
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
