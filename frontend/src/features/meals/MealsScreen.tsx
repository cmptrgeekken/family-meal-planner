import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import {
  createMeal,
  deleteMeal,
  getCategories,
  getMeals,
  getStoreTags,
  updateMeal,
  type ApiMeal,
  type ApiMealIngredient,
  type ApiMealPayload,
} from "../shared/api";

type MealFormIngredient = {
  name: string;
  group: ApiMealIngredient["group"];
  storeTagSlug: string;
  quantityLabel: string;
};

type MealFormState = {
  id?: string;
  name: string;
  slug: string;
  categorySlug: string;
  costTier: ApiMeal["costTier"];
  kidFavorite: boolean;
  lowEffort: boolean;
  notes: string;
  ingredients: MealFormIngredient[];
};

const emptyIngredient: MealFormIngredient = {
  name: "",
  group: "protein",
  storeTagSlug: "",
  quantityLabel: "",
};

const emptyMealForm: MealFormState = {
  name: "",
  slug: "",
  categorySlug: "",
  costTier: "standard",
  kidFavorite: false,
  lowEffort: false,
  notes: "",
  ingredients: [{ ...emptyIngredient }],
};

const groceryGroups: ApiMealIngredient["group"][] = ["protein", "carb", "veg", "fruit", "extras"];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mealToForm(meal: ApiMeal): MealFormState {
  return {
    id: meal.id,
    name: meal.name,
    slug: meal.slug,
    categorySlug: meal.categorySlug,
    costTier: meal.costTier,
    kidFavorite: meal.kidFavorite,
    lowEffort: meal.lowEffort,
    notes: meal.notes ?? "",
    ingredients: meal.ingredients.map((ingredient) => ({
      name: ingredient.name,
      group: ingredient.group,
      storeTagSlug: ingredient.storeTagSlug ?? "",
      quantityLabel: ingredient.quantityLabel ?? "",
    })),
  };
}

function formToPayload(form: MealFormState): ApiMealPayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    categorySlug: form.categorySlug,
    costTier: form.costTier,
    kidFavorite: form.kidFavorite,
    lowEffort: form.lowEffort,
    notes: form.notes.trim() || undefined,
    ingredients: form.ingredients
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        group: ingredient.group,
        storeTagSlug: ingredient.storeTagSlug || undefined,
        quantityLabel: ingredient.quantityLabel.trim() || undefined,
      })),
  };
}

export function MealsScreen() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    categorySlug: "",
    storeTagSlug: "",
    kidFavorite: false,
    lowEffort: false,
  });
  const [mealForm, setMealForm] = useState<MealFormState>(emptyMealForm);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const storeTagsQuery = useQuery({
    queryKey: ["store-tags"],
    queryFn: getStoreTags,
  });
  const mealsQuery = useQuery({
    queryKey: ["meals", filters],
    queryFn: () =>
      getMeals({
        categorySlug: filters.categorySlug || undefined,
        storeTagSlug: filters.storeTagSlug || undefined,
        kidFavorite: filters.kidFavorite || undefined,
        lowEffort: filters.lowEffort || undefined,
      }),
  });
  const createMealMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      setMealForm({
        ...emptyMealForm,
        categorySlug: categoriesQuery.data?.categories[0]?.slug ?? "",
      });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
  const updateMealMutation = useMutation({
    mutationFn: (payload: { mealId: string; meal: ApiMealPayload }) => updateMeal(payload.mealId, payload.meal),
    onSuccess: () => {
      setMealForm({
        ...emptyMealForm,
        categorySlug: categoriesQuery.data?.categories[0]?.slug ?? "",
      });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan-preview"] });
    },
  });
  const deleteMealMutation = useMutation({
    mutationFn: deleteMeal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan-preview"] });
    },
  });

  const isMealMutationPending = createMealMutation.isPending || updateMealMutation.isPending || deleteMealMutation.isPending;
  const categories = categoriesQuery.data?.categories ?? [];
  const storeTags = storeTagsQuery.data?.storeTags ?? [];
  const activeCategorySlug = mealForm.categorySlug || categories[0]?.slug || "";

  function updateIngredient(index: number, patch: Partial<MealFormIngredient>) {
    setMealForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }));
  }

  function removeIngredient(index: number) {
    setMealForm((current) => ({
      ...current,
      ingredients:
        current.ingredients.length === 1
          ? [{ ...emptyIngredient }]
          : current.ingredients.filter((_ingredient, ingredientIndex) => ingredientIndex !== index),
    }));
  }

  function handleSubmitMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const meal = formToPayload({
      ...mealForm,
      categorySlug: activeCategorySlug,
    });

    if (!meal.name || !meal.slug || !meal.categorySlug || meal.ingredients.length === 0) {
      return;
    }

    if (mealForm.id) {
      updateMealMutation.mutate({ mealId: mealForm.id, meal });
      return;
    }

    createMealMutation.mutate(meal);
  }

  return (
    <div className="screen-layout">
      <SectionCard
        title={mealForm.id ? "Edit Meal" : "Add Meal"}
        subtitle="Parent-friendly meal maintenance with practical ingredient details for grocery generation."
      >
        <form className="meal-editor-form" onSubmit={handleSubmitMeal}>
          <div className="field-grid">
            <label>
              <span>Name</span>
              <input
                value={mealForm.name}
                placeholder="Taco bowls"
                onChange={(event) => {
                  const name = event.target.value;
                  setMealForm((current) => ({
                    ...current,
                    name,
                    slug: current.id ? current.slug : slugify(name),
                  }));
                }}
              />
            </label>
            <label>
              <span>Slug</span>
              <input
                value={mealForm.slug}
                placeholder="taco-bowls"
                onChange={(event) => setMealForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={activeCategorySlug}
                onChange={(event) => setMealForm((current) => ({ ...current, categorySlug: event.target.value }))}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Cost tier</span>
              <select
                value={mealForm.costTier}
                onChange={(event) =>
                  setMealForm((current) => ({ ...current, costTier: event.target.value as ApiMeal["costTier"] }))
                }
              >
                <option value="budget">Budget</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </label>
          </div>

          <label className="notes-field">
            <span>Notes / parent upgrades</span>
            <textarea
              value={mealForm.notes}
              placeholder="Add peppers, Greek yogurt, or a quick salad."
              onChange={(event) => setMealForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <div className="toggle-row">
            <button
              type="button"
              className={mealForm.kidFavorite ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setMealForm((current) => ({ ...current, kidFavorite: !current.kidFavorite }))}
            >
              Kid favorite
            </button>
            <button
              type="button"
              className={mealForm.lowEffort ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setMealForm((current) => ({ ...current, lowEffort: !current.lowEffort }))}
            >
              Low effort
            </button>
          </div>

          <div className="ingredient-editor-list">
            <div className="meal-form-section-heading">
              <h3>Ingredients</h3>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setMealForm((current) => ({
                    ...current,
                    ingredients: [...current.ingredients, { ...emptyIngredient }],
                  }))
                }
              >
                Add ingredient
              </button>
            </div>
            {mealForm.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-editor-row">
                <label>
                  <span>Name</span>
                  <input
                    value={ingredient.name}
                    placeholder="Chicken"
                    onChange={(event) => updateIngredient(index, { name: event.target.value })}
                  />
                </label>
                <label>
                  <span>Group</span>
                  <select
                    value={ingredient.group}
                    onChange={(event) => updateIngredient(index, { group: event.target.value as ApiMealIngredient["group"] })}
                  >
                    {groceryGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Quantity</span>
                  <input
                    value={ingredient.quantityLabel}
                    placeholder="1 pack"
                    onChange={(event) => updateIngredient(index, { quantityLabel: event.target.value })}
                  />
                </label>
                <label>
                  <span>Store</span>
                  <select
                    value={ingredient.storeTagSlug}
                    onChange={(event) => updateIngredient(index, { storeTagSlug: event.target.value })}
                  >
                    <option value="">Any store</option>
                    {storeTags.map((storeTag) => (
                      <option key={storeTag.id} value={storeTag.slug}>
                        {storeTag.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="secondary-button danger-button" onClick={() => removeIngredient(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="toggle-row">
            <button type="submit" className="primary-button" disabled={isMealMutationPending}>
              {mealForm.id ? "Save meal" : "Add meal"}
            </button>
            {mealForm.id ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setMealForm({
                    ...emptyMealForm,
                    categorySlug: categories[0]?.slug ?? "",
                  })
                }
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          {createMealMutation.isError || updateMealMutation.isError ? (
            <p className="muted-text">Meal could not be saved. Check required fields and duplicate slugs.</p>
          ) : null}
          {deleteMealMutation.isError ? (
            <p className="muted-text">
              {deleteMealMutation.error instanceof Error ? deleteMealMutation.error.message : "Meal could not be deleted."}
            </p>
          ) : null}
        </form>
      </SectionCard>

      <SectionCard title="Meal Browser" subtitle="Use filter chips and quick toggles to narrow the list fast on a phone.">
        <div className="filter-stack">
          <select
            value={filters.categorySlug}
            onChange={(event) => setFilters((current) => ({ ...current, categorySlug: event.target.value }))}
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.storeTagSlug}
            onChange={(event) => setFilters((current) => ({ ...current, storeTagSlug: event.target.value }))}
          >
            <option value="">All stores</option>
            {storeTagsQuery.data?.storeTags.map((storeTag) => (
              <option key={storeTag.id} value={storeTag.slug}>
                {storeTag.name}
              </option>
            ))}
          </select>

          <div className="toggle-row">
            <button
              type="button"
              className={filters.kidFavorite ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setFilters((current) => ({ ...current, kidFavorite: !current.kidFavorite }))}
            >
              Kid favorite
            </button>
            <button
              type="button"
              className={filters.lowEffort ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setFilters((current) => ({ ...current, lowEffort: !current.lowEffort }))}
            >
              Low effort
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Results" subtitle="Meal cards are intentionally compact and thumb-friendly for quick picking.">
        {mealsQuery.isLoading ? <p>Loading meals...</p> : null}
        {!mealsQuery.isLoading && (mealsQuery.data?.meals.length ?? 0) === 0 ? (
          <EmptyState title="No matching meals" message="Try clearing one or more filters." />
        ) : null}
        <div className="meal-card-grid">
          {mealsQuery.data?.meals.map((meal) => (
            <article key={meal.id} className="meal-card">
              <div className="meal-card-topline">
                <span className="pill-muted category-pill">
                  {meal.categoryIconId ? <img src={`/icons/${meal.categoryIconId}.svg`} alt="" /> : null}
                  {meal.category}
                </span>
                <span className={`pill-cost pill-cost-${meal.costTier}`}>{meal.costTier}</span>
              </div>
              <h3>{meal.name}</h3>
              <p>{meal.notes ?? "No notes yet."}</p>
              <div className="meal-card-flags">
                {meal.kidFavorite ? <span>Kid favorite</span> : null}
                {meal.lowEffort ? <span>Low effort</span> : null}
              </div>
              <div className="meal-card-ingredients">
                {meal.ingredients.slice(0, 4).map((ingredient) => (
                  <span key={`${meal.id}-${ingredient.name}`}>{ingredient.name}</span>
                ))}
                {meal.ingredients.length > 4 ? <span>+{meal.ingredients.length - 4} more</span> : null}
              </div>
              <div className="meal-card-actions">
                <button type="button" className="secondary-button" onClick={() => setMealForm(mealToForm(meal))}>
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  disabled={isMealMutationPending}
                  onClick={() => {
                    if (window.confirm(`Delete "${meal.name}"? Meals used in saved plans cannot be deleted.`)) {
                      deleteMealMutation.mutate(meal.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
