import type { GroceryListItem, Meal, WeeklyPlanPreview } from "./models.js";
import { selectionMatchesSlotFilter } from "./plan-slots.js";

export function buildGroceryList(preview: WeeklyPlanPreview, meals: Meal[], slotSlugs?: string[]): GroceryListItem[] {
  const mealMap = new Map(meals.map((meal) => [meal.id, meal]));
  const selectedMeals = preview.selections
    .filter((selection) => selectionMatchesSlotFilter(selection, slotSlugs))
    .map((selection) => {
      const meal = mealMap.get(selection.mealId);

      return meal
        ? {
            meal,
            selection,
          }
        : null;
    })
    .filter((selection): selection is NonNullable<typeof selection> => Boolean(selection));

  const items = new Map<string, GroceryListItem>();

  for (const { meal, selection } of selectedMeals) {
    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.group}:${ingredient.name.toLowerCase()}`;
      const current = items.get(key);
      const usageContext = {
        day: selection.day,
        slotName: selection.slot,
        slotSlug: selection.slotSlug,
        mealName: meal.name,
        mealId: meal.id,
      };

      if (!current) {
        items.set(key, {
          name: ingredient.name,
          group: ingredient.group,
          quantityLabels: ingredient.quantityLabel ? [ingredient.quantityLabel] : [],
          storeTags: ingredient.storeTag ? [ingredient.storeTag] : [],
          usedInMeals: [meal.name],
          usedIn: [usageContext],
        });
        continue;
      }

      if (ingredient.quantityLabel && !current.quantityLabels.includes(ingredient.quantityLabel)) {
        current.quantityLabels.push(ingredient.quantityLabel);
      }

      if (ingredient.storeTag && !current.storeTags.includes(ingredient.storeTag)) {
        current.storeTags.push(ingredient.storeTag);
      }

      if (!current.usedInMeals.includes(meal.name)) {
        current.usedInMeals.push(meal.name);
      }

      if (!current.usedIn.some((usage) => usage.day === selection.day && usage.slotSlug === selection.slotSlug && usage.mealId === meal.id)) {
        current.usedIn.push(usageContext);
      }
    }
  }

  return [...items.values()].sort((left, right) => {
    if (left.group === right.group) {
      return left.name.localeCompare(right.name);
    }

    return left.group.localeCompare(right.group);
  });
}
