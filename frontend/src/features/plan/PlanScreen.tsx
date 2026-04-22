import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getCategories, getMeals, getWeeklyPlan, previewWeeklyPlan, saveWeeklyPlan, type ApiMeal } from "../shared/api";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function PlanScreen() {
  const queryClient = useQueryClient();
  const weekStartDate = useMemo(getUpcomingMondayIso, []);
  const mealsQuery = useQuery({
    queryKey: ["meals", "plan-screen"],
    queryFn: () => getMeals({}),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "plan-screen"],
    queryFn: getCategories,
  });
  const savedPlanQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate],
    queryFn: () => getWeeklyPlan(weekStartDate),
  });
  const meals = mealsQuery.data?.meals ?? [];
  const categories = categoriesQuery.data?.categories ?? [];

  const [selections, setSelections] = useState<Record<(typeof weekdays)[number], string>>(getEmptySelections);
  const [categorySelections, setCategorySelections] =
    useState<Record<(typeof weekdays)[number], string>>(getEmptySelections);

  const preview = useMutation({
    mutationFn: () =>
      previewWeeklyPlan({
        weekStartDate,
        selections: getSelectedMeals(selections),
      }),
  });
  const savePlan = useMutation({
    mutationFn: () =>
      saveWeeklyPlan({
        weekStartDate,
        selections: getSelectedMeals(selections),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan", weekStartDate] });
    },
  });

  const mealById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);
  const mealsByCategorySlug = useMemo(() => {
    const map = new Map<string, ApiMeal[]>();

    for (const meal of meals) {
      map.set(meal.categorySlug, [...(map.get(meal.categorySlug) ?? []), meal]);
    }

    return map;
  }, [meals]);
  const hasSelections = weekdays.some((day) => selections[day]);
  const feedbackData = preview.data ?? savePlan.data;

  useEffect(() => {
    if (!savedPlanQuery.data?.weeklyPlan) {
      return;
    }

    const nextSelections = getEmptySelections();
    const nextCategorySelections = getEmptySelections();

    for (const selection of savedPlanQuery.data.weeklyPlan.selections) {
      nextSelections[selection.day] = selection.mealId;
      nextCategorySelections[selection.day] = mealById.get(selection.mealId)?.categorySlug ?? "";
    }

    setSelections(nextSelections);
    setCategorySelections(nextCategorySelections);
  }, [mealById, savedPlanQuery.data]);

  function clearDay(day: (typeof weekdays)[number]) {
    setSelections((current) => ({
      ...current,
      [day]: "",
    }));
    setCategorySelections((current) => ({
      ...current,
      [day]: "",
    }));
  }

  return (
    <div className="screen-layout">
      <SectionCard
        title="Weekly Plan"
        subtitle={`Build and save dinners for the week of ${weekStartDate}.`}
        actions={
          <div className="toggle-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSelections(getEmptySelections());
                setCategorySelections(getEmptySelections());
              }}
              disabled={!hasSelections || savePlan.isPending || preview.isPending}
            >
              Clear Week
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => preview.mutate()}
              disabled={preview.isPending || meals.length === 0 || !hasSelections}
            >
              {preview.isPending ? "Previewing..." : "Preview Week"}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => savePlan.mutate()}
              disabled={savePlan.isPending || meals.length === 0 || !hasSelections}
            >
              {savePlan.isPending ? "Saving..." : "Save Week"}
            </button>
          </div>
        }
      >
        {mealsQuery.isLoading ? <p>Loading meals...</p> : null}
        {mealsQuery.isError ? (
          <StatusMessage
            tone="error"
            title="Meals unavailable"
            message="The planner needs meal data from the backend before a week can be built."
          />
        ) : null}
        {categoriesQuery.isError ? (
          <StatusMessage
            tone="error"
            title="Categories unavailable"
            message="The planner needs category data before category-first planning can work."
          />
        ) : null}
        {savedPlanQuery.isLoading ? <p>Checking for a saved plan...</p> : null}
        {savePlan.isSuccess ? (
          <StatusMessage tone="success" title="Week saved" message="This dinner plan is now persisted." />
        ) : null}
        {savePlan.isError ? (
          <StatusMessage
            tone="error"
            title="Could not save week"
            message={savePlan.error instanceof Error ? savePlan.error.message : "The weekly plan could not be saved."}
          />
        ) : null}
        {!mealsQuery.isLoading && meals.length === 0 ? (
          <EmptyState
            title="No meals yet"
            message="Add or seed meals in the backend first, then this screen can become the main planning workflow."
          />
        ) : null}
        {meals.length > 0 ? (
          <div className="day-stack">
            {weekdays.map((day) => {
              const selectedMeal = mealById.get(selections[day]);

              return (
                <label key={day} className="day-card">
                  <div className="day-card-copy">
                    <p className="day-label">{day}</p>
                    <span className="slot-pill">Dinner</span>
                  </div>
                  <div className="planner-category-grid" aria-label={`${day} category`}>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={
                          categorySelections[day] === category.slug
                            ? "planner-category-button planner-category-button-active"
                            : "planner-category-button"
                        }
                        onClick={() => {
                          setCategorySelections((current) => ({
                            ...current,
                            [day]: category.slug,
                          }));
                          setSelections((current) => ({
                            ...current,
                            [day]: mealById.get(current[day])?.categorySlug === category.slug ? current[day] : "",
                          }));
                        }}
                      >
                        {category.iconId ? <img src={`/icons/${category.iconId}.svg`} alt="" /> : null}
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                  <select
                    value={selections[day]}
                    disabled={!categorySelections[day]}
                    onChange={(event) =>
                      setSelections((current) => ({
                        ...current,
                        [day]: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {categorySelections[day] ? "Choose a meal" : "Choose a category first"}
                    </option>
                    {(mealsByCategorySlug.get(categorySelections[day]) ?? []).map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))}
                  </select>
                  {selectedMeal ? <MealSummaryChip meal={selectedMeal} /> : null}
                  {selectedMeal ? (
                    <button
                      type="button"
                      className="secondary-button day-remove-button"
                      onClick={() => clearDay(day)}
                    >
                      Remove {day}
                    </button>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Preview Feedback"
        subtitle="Rule feedback and grocery output show up here before the plan is saved."
      >
        {preview.isIdle ? (
          <EmptyState
            title="Nothing previewed yet"
            message="Pick a few dinners, then preview the week to see validation and grocery grouping."
          />
        ) : null}
        {preview.isError ? (
          <StatusMessage
            tone="error"
            title="Preview failed"
            message="The API could not preview the current selections. Check that the backend is running and seeded."
          />
        ) : null}
        {feedbackData ? (
          <div className="preview-grid">
            <div className="mini-panel">
              <h3>Validation</h3>
              {feedbackData.validationIssues.length === 0 ? (
                <p>No rule violations in this preview.</p>
              ) : (
                <ul className="plain-list">
                  {feedbackData.validationIssues.map((issue) => (
                    <li key={`${issue.code}-${issue.mealId ?? issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mini-panel">
              <h3>Grocery Snapshot</h3>
              {feedbackData.groceryList.length === 0 ? (
                <p>No grocery items generated yet.</p>
              ) : (
                <ul className="plain-list">
                  {feedbackData.groceryList.slice(0, 8).map((item) => (
                    <li key={`${item.group}-${item.name}`}>
                      <strong>{item.name}</strong> <span className="muted-text">({item.group})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

function getEmptySelections() {
  return {
    Monday: "",
    Tuesday: "",
    Wednesday: "",
    Thursday: "",
    Friday: "",
    Saturday: "",
    Sunday: "",
  };
}

function getSelectedMeals(selections: Record<(typeof weekdays)[number], string>) {
  return weekdays.filter((day) => selections[day]).map((day) => ({ day, mealId: selections[day] as string }));
}

function MealSummaryChip({ meal }: { meal: ApiMeal }) {
  return (
    <div className="meal-chip">
      <strong>{meal.name}</strong>
      <span>{meal.category}</span>
      <span>{meal.lowEffort ? "Low effort" : "Longer cook"}</span>
    </div>
  );
}

function getUpcomingMondayIso() {
  const current = new Date();
  const day = current.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  current.setDate(current.getDate() + daysUntilMonday);
  return current.toISOString().slice(0, 10);
}
