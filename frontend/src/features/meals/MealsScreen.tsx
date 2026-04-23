import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { Modal } from "../../components/Modal";
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

function buildEmptyMealForm(defaultCategorySlug: string): MealFormState {
  return {
    ...emptyMealForm,
    categorySlug: defaultCategorySlug,
    ingredients: [{ ...emptyIngredient }],
  };
}

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

function getMealValidationMessage(meal: ApiMealPayload) {
  if (!meal.name) {
    return "Meal name is required.";
  }

  if (!meal.slug) {
    return "Meal slug is required.";
  }

  if (!meal.categorySlug) {
    return "Choose a category before saving.";
  }

  if (meal.ingredients.length === 0) {
    return "Add at least one ingredient with a name.";
  }

  return null;
}

export function MealsScreen() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    categorySlug: "",
    storeTagSlug: "",
    kidFavorite: false,
    lowEffort: false,
  });
  const [mealForm, setMealForm] = useState<MealFormState>(emptyMealForm);
  const [isMealEditorOpen, setIsMealEditorOpen] = useState(false);
  const [mealFormError, setMealFormError] = useState<string | null>(null);

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
  const visibleMeals =
    mealsQuery.data?.meals.filter((meal) => {
      const search = filters.search.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return (
        meal.name.toLowerCase().includes(search) ||
        meal.category.toLowerCase().includes(search) ||
        meal.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(search))
      );
    }) ?? [];
  const createMealMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: () => {
      closeMealEditor();
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
  const updateMealMutation = useMutation({
    mutationFn: (payload: { mealId: string; meal: ApiMealPayload }) => updateMeal(payload.mealId, payload.meal),
    onSuccess: () => {
      closeMealEditor();
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
  const activeFilterCount = [filters.categorySlug, filters.storeTagSlug, filters.search.trim()]
    .filter(Boolean)
    .concat(filters.kidFavorite ? ["kidFavorite"] : [])
    .concat(filters.lowEffort ? ["lowEffort"] : []).length;
  const visibleMealCountLabel = useMemo(() => {
    const count = visibleMeals.length;
    return `${count} meal${count === 1 ? "" : "s"}`;
  }, [visibleMeals.length]);

  function resetMealForm() {
    setMealForm(buildEmptyMealForm(categories[0]?.slug ?? ""));
    setMealFormError(null);
  }

  function openCreateMealModal() {
    createMealMutation.reset();
    updateMealMutation.reset();
    resetMealForm();
    setIsMealEditorOpen(true);
  }

  function openEditMealModal(meal: ApiMeal) {
    createMealMutation.reset();
    updateMealMutation.reset();
    setMealForm(mealToForm(meal));
    setIsMealEditorOpen(true);
  }

  function closeMealEditor() {
    createMealMutation.reset();
    updateMealMutation.reset();
    setIsMealEditorOpen(false);
    resetMealForm();
  }

  function updateIngredient(index: number, patch: Partial<MealFormIngredient>) {
    setMealFormError(null);
    setMealForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }));
  }

  function removeIngredient(index: number) {
    setMealFormError(null);
    setMealForm((current) => ({
      ...current,
      ingredients:
        current.ingredients.length === 1
          ? [{ ...emptyIngredient }]
          : current.ingredients.filter((_ingredient, ingredientIndex) => ingredientIndex !== index),
    }));
  }

  function moveIngredient(index: number, direction: -1 | 1) {
    setMealFormError(null);
    setMealForm((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.ingredients.length) {
        return current;
      }

      const ingredients = [...current.ingredients];
      const [ingredient] = ingredients.splice(index, 1);

      if (!ingredient) {
        return current;
      }

      ingredients.splice(nextIndex, 0, ingredient);

      return {
        ...current,
        ingredients,
      };
    });
  }

  function addIngredient() {
    setMealFormError(null);
    setMealForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ...emptyIngredient }],
    }));
  }

  function handleSubmitMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const meal = formToPayload({
      ...mealForm,
      categorySlug: activeCategorySlug,
    });

    const validationMessage = getMealValidationMessage(meal);

    if (validationMessage) {
      setMealFormError(validationMessage);
      return;
    }

    if (mealForm.id) {
      updateMealMutation.mutate({ mealId: mealForm.id, meal });
      return;
    }

    createMealMutation.mutate(meal);
  }

  return (
    <div className="screen-layout meals-screen-layout">
      <SectionCard
        title="Meal Library"
        subtitle="Browse the catalog, filter quickly, and open add or edit in a focused modal instead of chasing a form up the page."
        className="meals-library-card"
        actions={
          <div className="section-toolbar">
            <span className="pill-muted">{visibleMealCountLabel}</span>
            <button type="button" className="primary-button" onClick={openCreateMealModal}>
              Add meal
            </button>
          </div>
        }
      >
        <div className="meals-library-stack">
          <div className="filter-stack meals-filter-grid">
            <input
              value={filters.search}
              placeholder="Search meals or ingredients"
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />

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

            <div className="toggle-row meals-filter-toggles">
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
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setFilters({
                      search: "",
                      categorySlug: "",
                      storeTagSlug: "",
                      kidFavorite: false,
                      lowEffort: false,
                    })
                  }
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {deleteMealMutation.isError ? (
            <p className="muted-text">
              {deleteMealMutation.error instanceof Error ? deleteMealMutation.error.message : "Meal could not be deleted."}
            </p>
          ) : null}

          {mealsQuery.isLoading ? <p>Loading meals...</p> : null}
          {!mealsQuery.isLoading && visibleMeals.length === 0 ? (
            <EmptyState title="No matching meals" message="Try clearing one or more filters." />
          ) : null}
          <div className="meal-card-grid">
            {visibleMeals.map((meal) => (
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
                  <button type="button" className="secondary-button" onClick={() => openEditMealModal(meal)}>
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
        </div>
      </SectionCard>

      <Modal
        isOpen={isMealEditorOpen}
        title={mealForm.id ? "Edit Meal" : "Add Meal"}
        description="Update the meal details and ingredients without losing your place in the library."
        onClose={closeMealEditor}
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
                  setMealFormError(null);
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
                onChange={(event) => {
                  setMealFormError(null);
                  setMealForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                }}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={activeCategorySlug}
                onChange={(event) => {
                  setMealFormError(null);
                  setMealForm((current) => ({ ...current, categorySlug: event.target.value }));
                }}
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
                onChange={(event) => {
                  setMealFormError(null);
                  setMealForm((current) => ({ ...current, costTier: event.target.value as ApiMeal["costTier"] }));
                }}
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
              onChange={(event) => {
                setMealFormError(null);
                setMealForm((current) => ({ ...current, notes: event.target.value }));
              }}
            />
          </label>

          <div className="toggle-row">
            <button
              type="button"
              className={mealForm.kidFavorite ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => {
                setMealFormError(null);
                setMealForm((current) => ({ ...current, kidFavorite: !current.kidFavorite }));
              }}
            >
              Kid favorite
            </button>
            <button
              type="button"
              className={mealForm.lowEffort ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => {
                setMealFormError(null);
                setMealForm((current) => ({ ...current, lowEffort: !current.lowEffort }));
              }}
            >
              Low effort
            </button>
          </div>

          <div className="ingredient-editor-list">
            <div className="meal-form-section-heading">
              <h3>Ingredients</h3>
              <p>Order ingredients the way you want them to appear in grocery output.</p>
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
                <div className="ingredient-row-actions">
                  <button
                    type="button"
                    className="secondary-button ingredient-order-button"
                    onClick={() => moveIngredient(index, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="secondary-button ingredient-order-button"
                    onClick={() => moveIngredient(index, 1)}
                    disabled={index === mealForm.ingredients.length - 1}
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="secondary-button ingredient-add-button" onClick={addIngredient}>
              Add ingredient
            </button>
          </div>

          {mealFormError ? <p className="form-error-text">{mealFormError}</p> : null}
          <div className="toggle-row modal-action-row">
            <button type="submit" className="primary-button" disabled={isMealMutationPending}>
              {mealForm.id ? "Save meal" : "Add meal"}
            </button>
            <button type="button" className="secondary-button" onClick={closeMealEditor}>
              Cancel
            </button>
          </div>
          {createMealMutation.isError || updateMealMutation.isError ? (
            <p className="form-error-text">
              {createMealMutation.error instanceof Error
                ? createMealMutation.error.message
                : updateMealMutation.error instanceof Error
                  ? updateMealMutation.error.message
                  : "Meal could not be saved. Check required fields and duplicate slugs."}
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
