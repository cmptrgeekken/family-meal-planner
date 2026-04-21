export const groceryGroups = ["protein", "carb", "veg", "fruit", "extras"] as const;

export const costTiers = ["budget", "standard", "premium"] as const;

export const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const planSlotNames = ["Dinner"] as const;
export const defaultPlanSlotName = "Dinner";

export type GroceryGroup = (typeof groceryGroups)[number];
export type CostTier = (typeof costTiers)[number];
export type WeekdayName = (typeof weekdayNames)[number];
export type PlanSlotName = (typeof planSlotNames)[number];

export type MealIngredient = {
  name: string;
  group: GroceryGroup;
  storeTag?: string;
  storeTagSlug?: string;
  quantityLabel?: string;
};

export type Meal = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  categorySlug?: string;
  categoryIconId?: string;
  costTier: CostTier;
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: MealIngredient[];
};

export type WeeklyPlanMealInput = {
  day: WeekdayName;
  slot: PlanSlotName;
  mealId: string;
};

export type WeeklyPlanPreview = {
  weekStartDate: string;
  selections: WeeklyPlanMealInput[];
};

export type PlanValidationIssue = {
  code: "duplicate_meal" | "premium_limit_exceeded" | "unknown_meal" | "duplicate_day_slot";
  message: string;
  mealId?: string;
};

export type GroceryListItem = {
  name: string;
  group: GroceryGroup;
  quantityLabels: string[];
  storeTags: string[];
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
  iconId?: string;
};

export type StoreTagRecord = {
  id: string;
  name: string;
  slug: string;
};
