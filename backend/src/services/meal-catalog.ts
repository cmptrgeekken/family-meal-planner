import { mealCategories, type Meal } from "../domain/models.js";

const mealCatalog: Meal[] = [
  {
    id: "chicken-quesadillas",
    name: "Chicken Quesadillas",
    category: "Chicken",
    costTier: "standard",
    kidFavorite: true,
    lowEffort: true,
    notes: "Add peppers and black beans for a parent upgrade.",
    ingredients: [
      { name: "Chicken", group: "protein", storeTag: "Costco", quantityLabel: "1 pack" },
      { name: "Tortillas", group: "carb", quantityLabel: "1 package" },
      { name: "Shredded Cheese", group: "extras", storeTag: "Costco", quantityLabel: "1 bag" },
      { name: "Bell Peppers", group: "veg", storeTag: "Cub", quantityLabel: "2 peppers" },
    ],
  },
  {
    id: "spaghetti-night",
    name: "Spaghetti Night",
    category: "Pasta",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: false,
    notes: "Serve with a quick salad on the side.",
    ingredients: [
      { name: "Spaghetti", group: "carb", quantityLabel: "1 box" },
      { name: "Ground Beef", group: "protein", storeTag: "Costco", quantityLabel: "1 pound" },
      { name: "Marinara Sauce", group: "extras", quantityLabel: "1 jar" },
      { name: "Romaine", group: "veg", storeTag: "Cub", quantityLabel: "1 head" },
    ],
  },
  {
    id: "breakfast-for-dinner",
    name: "Breakfast for Dinner",
    category: "Breakfast",
    costTier: "budget",
    kidFavorite: true,
    lowEffort: true,
    notes: "Add berries or yogurt to round it out.",
    ingredients: [
      { name: "Eggs", group: "protein", storeTag: "Costco", quantityLabel: "1 dozen" },
      { name: "Bread", group: "carb", quantityLabel: "1 loaf" },
      { name: "Berries", group: "fruit", storeTag: "Cub", quantityLabel: "1 clamshell" },
    ],
  },
  {
    id: "burger-bowls",
    name: "Burger Bowls",
    category: "Ground Meat",
    costTier: "premium",
    kidFavorite: false,
    lowEffort: false,
    notes: "Use air fryer potatoes for an easier version.",
    ingredients: [
      { name: "Ground Beef", group: "protein", storeTag: "Costco", quantityLabel: "2 pounds" },
      { name: "Potatoes", group: "carb", storeTag: "Costco", quantityLabel: "1 bag" },
      { name: "Lettuce", group: "veg", quantityLabel: "1 head" },
      { name: "Pickles", group: "extras", quantityLabel: "1 jar" },
    ],
  },
];

export function listMeals() {
  return mealCatalog;
}

export function listMealCategories() {
  return [...mealCategories];
}

export function findMealsByIds(ids: string[]) {
  const wanted = new Set(ids);
  return mealCatalog.filter((meal) => wanted.has(meal.id));
}
