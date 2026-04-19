import type { GroceryListItem, Meal, WeeklyPlanPreview } from "./models.js";

export function buildGroceryList(preview: WeeklyPlanPreview, meals: Meal[]): GroceryListItem[] {
  const selectedMeals = preview.selections
    .map((selection) => meals.find((meal) => meal.id === selection.mealId))
    .filter((meal): meal is Meal => Boolean(meal));

  const items = new Map<string, GroceryListItem>();

  for (const meal of selectedMeals) {
    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.group}:${ingredient.name.toLowerCase()}`;
      const current = items.get(key);

      if (!current) {
        items.set(key, {
          name: ingredient.name,
          group: ingredient.group,
          quantityLabels: ingredient.quantityLabel ? [ingredient.quantityLabel] : [],
          storeTags: ingredient.storeTag ? [ingredient.storeTag] : [],
          usedInMeals: [meal.name],
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
    }
  }

  return [...items.values()].sort((left, right) => {
    if (left.group === right.group) {
      return left.name.localeCompare(right.name);
    }

    return left.group.localeCompare(right.group);
  });
}
