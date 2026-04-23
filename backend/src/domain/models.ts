export const groceryGroups = ["protein", "carb", "veg", "fruit", "extras"] as const;

export const costTiers = ["budget", "standard", "premium"] as const;

export const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const defaultPlanSlotSlug = "dinner";
export const defaultPlanSlotName = "Dinner";

export type GroceryGroup = (typeof groceryGroups)[number];
export type CostTier = (typeof costTiers)[number];
export type WeekdayName = (typeof weekdayNames)[number];
export type PlanSlotRecord = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isEnabled: boolean;
};

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
  categoryWeeklyMinCount?: number;
  categoryWeeklyMaxCount?: number;
  categorySlotSlugs?: string[];
  costTier: CostTier;
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: MealIngredient[];
};

export type WeeklyPlanMealInput = {
  day: WeekdayName;
  slot: string;
  slotSlug: string;
  mealId: string;
};

export type WeeklyPlanPreview = {
  weekStartDate: string;
  selections: WeeklyPlanMealInput[];
};

export type PlanValidationIssue = {
  code:
    | "duplicate_meal"
    | "premium_limit_exceeded"
    | "unknown_meal"
    | "duplicate_day_slot"
    | "category_maximum_exceeded"
    | "category_minimum_unmet";
  message: string;
  mealId?: string;
  categorySlug?: string;
  planSlotSlug?: string;
};

export type GroceryListItem = {
  name: string;
  group: GroceryGroup;
  quantityLabels: string[];
  storeTags: string[];
  usedInMeals: string[];
  usedIn: GroceryUsageContext[];
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
  slotSlugs: string[];
  weeklyMinCount?: number;
  weeklyMaxCount?: number;
};

export type GroceryUsageContext = {
  day: WeekdayName;
  slotName: string;
  slotSlug: string;
  mealName: string;
  mealId: string;
};

export type StoreTagRecord = {
  id: string;
  name: string;
  slug: string;
};
