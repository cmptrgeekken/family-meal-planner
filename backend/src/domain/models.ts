export const mealCategories = [
  "Pasta",
  "Rice/Bowls",
  "Breakfast",
  "Sandwich/Snack",
  "Chicken",
  "Ground Meat",
  "Premium",
  "Fun/Zero-Cook",
] as const;

export const groceryGroups = ["protein", "carb", "veg", "fruit", "extras"] as const;

export const storeTags = ["Costco", "Cub", "Other"] as const;

export const costTiers = ["budget", "standard", "premium"] as const;

export const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type MealCategory = (typeof mealCategories)[number];
export type GroceryGroup = (typeof groceryGroups)[number];
export type StoreTag = (typeof storeTags)[number];
export type CostTier = (typeof costTiers)[number];
export type WeekdayName = (typeof weekdayNames)[number];

export type MealIngredient = {
  name: string;
  group: GroceryGroup;
  storeTag?: StoreTag;
  quantityLabel?: string;
};

export type Meal = {
  id: string;
  slug?: string;
  name: string;
  category: MealCategory;
  categorySlug?: string;
  costTier: CostTier;
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: MealIngredient[];
};

export type WeeklyPlanMealInput = {
  day: WeekdayName;
  mealId: string;
};

export type WeeklyPlanPreview = {
  weekStartDate: string;
  selections: WeeklyPlanMealInput[];
};

export type PlanValidationIssue = {
  code: "duplicate_meal" | "premium_limit_exceeded" | "unknown_meal";
  message: string;
  mealId?: string;
};

export type GroceryListItem = {
  name: string;
  group: GroceryGroup;
  quantityLabels: string[];
  storeTags: StoreTag[];
  usedInMeals: string[];
};

export type WeeklyPlan = {
  id: string;
  weekStartDate: string;
  selections: WeeklyPlanMealInput[];
};

export type MealCategoryRecord = {
  id: string;
  name: string;
  slug: string;
};
