import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import {
  getCategories,
  getMeals,
  getPlanSlots,
  getWeeklyPlan,
  previewWeeklyPlan,
  saveWeeklyPlan,
  type ApiCategory,
  type ApiMeal,
  type ApiPlanSlot,
} from "../shared/api";
import { plannerWeekdays, type PlannerWeekday } from "./planning-rule-hints";

const weekdays = plannerWeekdays;

type PlanCellKey = `${PlannerWeekday}:${string}`;
type PlannerSelections = Record<string, string>;

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
  const planSlotsQuery = useQuery({
    queryKey: ["plan-slots"],
    queryFn: getPlanSlots,
  });
  const savedPlanQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate],
    queryFn: () => getWeeklyPlan(weekStartDate),
  });
  const meals = mealsQuery.data?.meals ?? [];
  const categories = categoriesQuery.data?.categories ?? [];
  const planSlots = planSlotsQuery.data?.planSlots ?? [];
  const visiblePlanSlots = useMemo(
    () => getVisiblePlanSlots(planSlots, savedPlanQuery.data?.weeklyPlan.selections ?? []),
    [planSlots, savedPlanQuery.data?.weeklyPlan.selections],
  );

  const [selections, setSelections] = useState<PlannerSelections>({});
  const [categorySelections, setCategorySelections] = useState<PlannerSelections>({});

  const selectedMeals = useMemo(() => getSelectedMeals(selections), [selections]);
  const preview = useMutation({
    mutationFn: () =>
      previewWeeklyPlan({
        weekStartDate,
        selections: selectedMeals,
      }),
  });
  const savePlan = useMutation({
    mutationFn: () =>
      saveWeeklyPlan({
        weekStartDate,
        selections: selectedMeals,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan", weekStartDate] });
    },
  });

  const mealById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);
  const categoryBySlug = useMemo(() => new Map(categories.map((category) => [category.slug, category])), [categories]);
  const mealsByCategorySlug = useMemo(() => {
    const map = new Map<string, ApiMeal[]>();

    for (const meal of meals) {
      map.set(meal.categorySlug, [...(map.get(meal.categorySlug) ?? []), meal]);
    }

    return map;
  }, [meals]);
  const categoryCounts = useMemo(() => getCategoryCounts(selections, mealById), [mealById, selections]);
  const plannedCount = selectedMeals.length;
  const cellCount = weekdays.length * Math.max(1, visiblePlanSlots.length);
  const feedbackData = preview.data ?? savePlan.data;
  const blockingIssues = feedbackData?.validationIssues.filter((issue) => issue.code !== "category_minimum_unmet") ?? [];
  const minimumIssues = feedbackData?.validationIssues.filter((issue) => issue.code === "category_minimum_unmet") ?? [];

  useEffect(() => {
    if (!savedPlanQuery.data?.weeklyPlan) {
      return;
    }

    const nextSelections: PlannerSelections = {};
    const nextCategorySelections: PlannerSelections = {};

    for (const selection of savedPlanQuery.data.weeklyPlan.selections) {
      const key = getCellKey(selection.day, selection.slotSlug);
      nextSelections[key] = selection.mealId;
      nextCategorySelections[key] = mealById.get(selection.mealId)?.categorySlug ?? "";
    }

    setSelections(nextSelections);
    setCategorySelections(nextCategorySelections);
  }, [mealById, savedPlanQuery.data]);

  function clearCell(day: PlannerWeekday, slotSlug: string) {
    const key = getCellKey(day, slotSlug);

    setSelections((current) => omitKey(current, key));
    setCategorySelections((current) => omitKey(current, key));
  }

  function selectCategory(day: PlannerWeekday, slot: ApiPlanSlot, category: ApiCategory) {
    const key = getCellKey(day, slot.slug);
    const selectedMeal = mealById.get(selections[key] ?? "");
    const shouldKeepMeal = selectedMeal?.categorySlug === category.slug;

    setCategorySelections((current) => ({
      ...current,
      [key]: category.slug,
    }));
    setSelections((current) => (shouldKeepMeal ? current : omitKey(current, key)));
  }

  return (
    <div className="screen-layout">
      <SectionCard
        title="Weekly Plan"
        subtitle={`Build and save meals for the week of ${weekStartDate}.`}
        actions={
          <div className="toggle-row planner-action-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSelections({});
                setCategorySelections({});
              }}
              disabled={plannedCount === 0 || savePlan.isPending || preview.isPending}
            >
              Clear Week
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => preview.mutate()}
              disabled={preview.isPending || meals.length === 0 || plannedCount === 0}
            >
              {preview.isPending ? "Previewing..." : "Preview Week"}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => savePlan.mutate()}
              disabled={savePlan.isPending || meals.length === 0 || plannedCount === 0}
            >
              {savePlan.isPending ? "Saving..." : "Save Week"}
            </button>
          </div>
        }
      >
        {mealsQuery.isLoading || categoriesQuery.isLoading || planSlotsQuery.isLoading ? <p>Loading planner data...</p> : null}
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
        {planSlotsQuery.isError ? (
          <StatusMessage
            tone="error"
            title="Meal slots unavailable"
            message="The planner needs meal slot data before the week grid can be built."
          />
        ) : null}
        {savedPlanQuery.isLoading ? <p>Checking for a saved plan...</p> : null}
        {savePlan.isSuccess ? (
          <StatusMessage tone="success" title="Week saved" message="This meal plan is now persisted." />
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
        {!planSlotsQuery.isLoading && visiblePlanSlots.length === 0 ? (
          <EmptyState title="No enabled meal slots" message="Enable or create a meal slot in Settings before planning." />
        ) : null}
        {meals.length > 0 && visiblePlanSlots.length > 0 ? (
          <>
            <div className="plan-summary-bar" aria-live="polite">
              <strong>
                {plannedCount}/{cellCount} meals planned
              </strong>
              <span className={blockingIssues.length > 0 ? "rule-hint-text" : "muted-text"}>
                {blockingIssues.length > 0
                  ? "Some choices need attention before saving."
                  : "Preview before saving to catch repeat, premium, or category limits."}
              </span>
            </div>
            <div className="day-stack">
              {weekdays.map((day) => (
                <article key={day} className="day-card plan-day-card">
                  <div className="day-card-copy">
                    <p className="day-label">{day}</p>
                  </div>
                  <div className="plan-slot-stack">
                    {visiblePlanSlots.map((slot) => {
                      const key = getCellKey(day, slot.slug);
                      const selectedMeal = mealById.get(selections[key] ?? "");
                      const selectedCategorySlug = categorySelections[key] ?? selectedMeal?.categorySlug ?? "";
                      const eligibleCategories = categories.filter((category) => category.slotSlugs.includes(slot.slug));

                      return (
                        <div key={key} className="plan-slot-cell">
                          <div className="day-card-copy">
                            <span className={slot.isEnabled ? "slot-pill" : "slot-pill slot-pill-disabled"}>
                              {slot.name}
                              {slot.isEnabled ? "" : " (disabled)"}
                            </span>
                          </div>
                          {eligibleCategories.length === 0 ? (
                            <p className="muted-text">No categories are assigned to this slot.</p>
                          ) : (
                            <div className="planner-category-grid" aria-label={`${day} ${slot.name} category`}>
                              {eligibleCategories.map((category) => {
                                const availability = getCategoryAvailability(category, key, selections, mealById, categoryCounts);

                                return (
                                  <button
                                    key={category.id}
                                    type="button"
                                    className={
                                      selectedCategorySlug === category.slug
                                        ? "planner-category-button planner-category-button-active"
                                        : "planner-category-button"
                                    }
                                    disabled={!availability.available}
                                    title={availability.reason}
                                    aria-label={availability.reason ? `${category.name}: ${availability.reason}` : category.name}
                                    onClick={() => selectCategory(day, slot, category)}
                                  >
                                    {category.iconId ? <img src={`/icons/${category.iconId}.svg`} alt="" /> : null}
                                    <span>{category.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <select
                            aria-label={`${day} ${slot.name} meal`}
                            value={selections[key] ?? ""}
                            disabled={!selectedCategorySlug}
                            onChange={(event) =>
                              setSelections((current) =>
                                event.target.value
                                  ? {
                                      ...current,
                                      [key]: event.target.value,
                                    }
                                  : omitKey(current, key),
                              )
                            }
                          >
                            <option value="">
                              {selectedCategorySlug ? "Choose a meal" : "Choose a category first"}
                            </option>
                            {(mealsByCategorySlug.get(selectedCategorySlug) ?? []).map((meal) => (
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
                              onClick={() => clearCell(day, slot.slug)}
                            >
                              Remove {slot.name}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Preview Feedback"
        subtitle="Rule feedback and grocery output show up here before the plan is saved."
      >
        {preview.isIdle ? (
          <EmptyState
            title="Nothing previewed yet"
            message="Pick a few meals, then preview the week to see validation and grocery grouping."
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
                    <li key={`${issue.code}-${issue.mealId ?? issue.categorySlug ?? issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              )}
              {minimumIssues.length > 0 ? <p className="muted-text">Minimums are guidance and do not block saving.</p> : null}
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

function getCellKey(day: PlannerWeekday, slotSlug: string): PlanCellKey {
  return `${day}:${slotSlug}`;
}

function getCategoryCounts(selections: PlannerSelections, mealById: Map<string, ApiMeal>) {
  const counts = new Map<string, number>();

  Object.values(selections).forEach((mealId) => {
    const categorySlug = mealById.get(mealId)?.categorySlug;

    if (!categorySlug) {
      return;
    }

    counts.set(categorySlug, (counts.get(categorySlug) ?? 0) + 1);
  });

  return counts;
}

function getCategoryAvailability(
  category: ApiCategory,
  cellKey: string,
  selections: PlannerSelections,
  mealById: Map<string, ApiMeal>,
  categoryCounts: Map<string, number>,
) {
  const selectedMeal = mealById.get(selections[cellKey] ?? "");
  const currentCellUsesCategory = selectedMeal?.categorySlug === category.slug;
  const count = categoryCounts.get(category.slug) ?? 0;

  if (category.weeklyMaxCount != null && count >= category.weeklyMaxCount && !currentCellUsesCategory) {
    return {
      available: false,
      reason: `${category.name} limit reached for this week.`,
    };
  }

  return {
    available: true,
    reason: "",
  };
}

function getVisiblePlanSlots(planSlots: ApiPlanSlot[], selections: Array<{ slot: string; slotSlug: string }>) {
  const slotBySlug = new Map(planSlots.map((slot) => [slot.slug, slot]));
  const visibleSlots = planSlots.filter((slot) => slot.isEnabled);

  for (const selection of selections) {
    const slot = slotBySlug.get(selection.slotSlug);

    if (slot && !visibleSlots.some((visibleSlot) => visibleSlot.slug === slot.slug)) {
      visibleSlots.push(slot);
    }
  }

  return visibleSlots.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function omitKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

function getSelectedMeals(selections: PlannerSelections) {
  return Object.entries(selections)
    .filter((entry): entry is [PlanCellKey, string] => Boolean(entry[1]))
    .map(([key, mealId]) => {
      const [day, slotSlug] = key.split(":") as [PlannerWeekday, string];

      return { day, slotSlug, mealId };
    });
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
