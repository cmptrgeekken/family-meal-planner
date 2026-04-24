import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { Modal } from "../../components/Modal";
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

type PlanScreenProps = {
  weekStartDate: string;
};

export function PlanScreen({ weekStartDate }: PlanScreenProps) {
  const queryClient = useQueryClient();
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
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeEditorCellKey, setActiveEditorCellKey] = useState<string | null>(null);

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
  const feedbackGroceryGroups = useMemo(
    () => Array.from(new Set(feedbackData?.groceryList.map((item) => item.group) ?? [])),
    [feedbackData],
  );
  const feedbackSummary = useMemo(() => {
    if (!feedbackData) {
      return "";
    }

    return [
      `${blockingIssues.length} ${blockingIssues.length === 1 ? "blocking issue" : "blocking issues"}`,
      `${minimumIssues.length} ${minimumIssues.length === 1 ? "guidance note" : "guidance notes"}`,
      `${feedbackData.groceryList.length} ${feedbackData.groceryList.length === 1 ? "grocery item" : "grocery items"}`,
    ].join(" • ");
  }, [blockingIssues.length, feedbackData, minimumIssues.length]);

  useEffect(() => {
    setSelections({});
    setCategorySelections({});
    setActiveEditorCellKey(null);
    preview.reset();
    savePlan.reset();
  }, [weekStartDate]);

  useEffect(() => {
    if (savedPlanQuery.isLoading) {
      return;
    }

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
    setActiveEditorCellKey(null);
  }, [mealById, savedPlanQuery.data, savedPlanQuery.isLoading]);

  function clearCell(day: PlannerWeekday, slotSlug: string) {
    const key = getCellKey(day, slotSlug);

    setSelections((current) => omitKey(current, key));
    setCategorySelections((current) => omitKey(current, key));
    setActiveEditorCellKey((current) => (current === key ? null : current));
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
    setActiveEditorCellKey(key);
  }

  function openPreviewModal() {
    preview.reset();
    setPreviewModalOpen(true);
    preview.mutate();
  }

  return (
    <div className="screen-layout plan-screen-layout">
      <SectionCard
        title="Weekly Plan"
        subtitle={`Build and save meals for the week of ${weekStartDate}.`}
        actions={
          <div className="toggle-row planner-action-row">
            <div className={blockingIssues.length > 0 ? "planner-command-pill planner-command-pill-alert" : "planner-command-pill"}>
              <strong>{plannedCount}/{cellCount}</strong>
              <span>{blockingIssues.length > 0 ? "needs review" : "planned"}</span>
            </div>
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
              onClick={openPreviewModal}
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
              <div className="plan-summary-copy">
                <strong>
                  {plannedCount}/{cellCount} meals planned
                </strong>
                <span className={blockingIssues.length > 0 ? "rule-hint-text" : "muted-text"}>
                  {blockingIssues.length > 0
                    ? "Some choices need attention before saving."
                    : "Preview before saving to catch repeat, premium, or category limits."}
                </span>
              </div>
              {feedbackData ? (
                <div
                  className={
                    blockingIssues.length > 0
                      ? "planner-feedback-inline planner-feedback-inline-alert"
                      : "planner-feedback-inline"
                  }
                >
                  <div className="planner-feedback-inline-copy">
                    <strong>{preview.isSuccess ? "Latest preview" : "Saved week feedback"}</strong>
                    <span>{feedbackSummary}</span>
                  </div>
                  <button type="button" className="secondary-button planner-inline-button" onClick={() => setPreviewModalOpen(true)}>
                    View details
                  </button>
                </div>
              ) : null}
            </div>
            <div className="day-stack planner-week-grid">
              {weekdays.map((day) => (
                <article key={day} className="day-card plan-day-card">
                  <div className="day-card-copy plan-day-heading">
                    <p className="day-label">{day}</p>
                  </div>
                  <div
                    className="plan-slot-stack"
                    style={
                      {
                        "--plan-slot-count": Math.max(1, visiblePlanSlots.length),
                      } as CSSProperties
                    }
                  >
                    {visiblePlanSlots.map((slot) => {
                      const key = getCellKey(day, slot.slug);
                      const selectedMeal = mealById.get(selections[key] ?? "");
                      const selectedCategorySlug = categorySelections[key] ?? selectedMeal?.categorySlug ?? "";
                      const selectedCategory = categoryBySlug.get(selectedCategorySlug);
                      const eligibleCategories = categories.filter((category) => category.slotSlugs.includes(slot.slug));
                      const isEditingCell = !selectedMeal || activeEditorCellKey === key;

                      return (
                        <div key={key} className="plan-slot-cell">
                          <div className="day-card-copy planner-slot-header">
                            <span className={slot.isEnabled ? "slot-pill" : "slot-pill slot-pill-disabled"}>
                              {slot.name}
                              {slot.isEnabled ? "" : " (disabled)"}
                            </span>
                            {selectedMeal ? (
                              <div className="planner-slot-actions">
                                {isEditingCell ? (
                                  <>
                                    <button
                                      type="button"
                                      className="secondary-button planner-inline-button planner-inline-button-compact"
                                      onClick={() => setActiveEditorCellKey(null)}
                                    >
                                      Done
                                    </button>
                                    <button
                                      type="button"
                                      className="secondary-button planner-inline-button planner-inline-button-compact"
                                      onClick={() => clearCell(day, slot.slug)}
                                    >
                                      Remove
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="secondary-button planner-inline-button planner-inline-button-compact"
                                      onClick={() => setActiveEditorCellKey(key)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="secondary-button planner-inline-button planner-inline-button-compact"
                                      onClick={() => clearCell(day, slot.slug)}
                                    >
                                      Remove
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : null}
                          </div>
                          {eligibleCategories.length === 0 ? (
                            <p className="muted-text">No categories are assigned to this slot.</p>
                          ) : isEditingCell ? (
                            <>
                              <div className="planner-category-grid" aria-label={`${day} ${slot.name} category`}>
                                {eligibleCategories.map((category) => {
                                  const availability = getCategoryAvailability(category, key, selections, mealById, categoryCounts);

                                  return (
                                    <button
                                      key={category.id}
                                      type="button"
                                      data-label={category.name}
                                      className={
                                        selectedCategorySlug === category.slug
                                          ? "planner-category-button planner-category-button-active"
                                          : "planner-category-button"
                                      }
                                      disabled={!availability.available}
                                      title={availability.reason || category.name}
                                      aria-label={availability.reason ? `${category.name}: ${availability.reason}` : category.name}
                                      onClick={() => selectCategory(day, slot, category)}
                                    >
                                      {category.iconId ? <img src={`/icons/${category.iconId}.svg`} alt="" /> : null}
                                      <span className="planner-category-label">{category.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="planner-selection-summary" aria-live="polite">
                                {selectedCategory?.iconId ? <img src={`/icons/${selectedCategory.iconId}.svg`} alt="" /> : null}
                                <p className="planner-selection-hint">
                                  {selectedCategory
                                    ? `Selected category: ${selectedCategory.name}. Choose a meal next.`
                                    : `Pick from ${eligibleCategories.length} ${eligibleCategories.length === 1 ? "category" : "categories"}.`}
                                </p>
                              </div>
                            </>
                          ) : selectedMeal ? (
                            <div className="planner-planned-summary" aria-live="polite">
                              <div className="planner-planned-summary-copy">
                                <div className="planner-planned-summary-headline">
                                  <strong>{selectedMeal.name}</strong>
                                  <span className={`pill-cost pill-cost-${selectedMeal.costTier}`}>{selectedMeal.costTier}</span>
                                </div>
                                <div className="planner-planned-summary-meta">
                                  <span className="pill-muted">{selectedCategory?.name ?? selectedMeal.category}</span>
                                  <span className="pill-muted">{selectedMeal.lowEffort ? "Low effort" : "Longer cook"}</span>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {selectedCategorySlug && isEditingCell ? (
                            <select
                              aria-label={`${day} ${slot.name} meal`}
                              value={selections[key] ?? ""}
                              onChange={(event) => {
                                const nextMealId = event.target.value;

                                setSelections((current) =>
                                  nextMealId
                                    ? {
                                        ...current,
                                        [key]: nextMealId,
                                      }
                                    : omitKey(current, key),
                                );
                                setActiveEditorCellKey(nextMealId ? null : key);
                              }}
                            >
                              <option value="">Choose a meal</option>
                              {(mealsByCategorySlug.get(selectedCategorySlug) ?? []).map((meal) => (
                                <option key={meal.id} value={meal.id}>
                                  {meal.name}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          {selectedMeal && isEditingCell ? <MealSummaryChip meal={selectedMeal} /> : null}
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
      <Modal
        title="Preview Feedback"
        description="Rule feedback and grocery output appear here before the plan is saved."
        isOpen={isPreviewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      >
        {preview.isPending ? <p>Previewing this week...</p> : null}
        {preview.isIdle && !feedbackData ? (
          <EmptyState
            title="Nothing previewed yet"
            message="Pick a few meals, then preview the week to see validation and grocery grouping."
          />
        ) : null}
        {preview.isError && !feedbackData ? (
          <StatusMessage
            tone="error"
            title="Preview failed"
            message="The API could not preview the current selections. Check that the backend is running and seeded."
          />
        ) : null}
        {feedbackData ? (
          <div className="preview-modal-stack">
            <div className="preview-summary-grid" aria-label="Preview summary">
              <div className={blockingIssues.length > 0 ? "preview-summary-card preview-summary-card-alert" : "preview-summary-card"}>
                <strong>{blockingIssues.length}</strong>
                <span>{blockingIssues.length === 1 ? "blocking issue" : "blocking issues"}</span>
              </div>
              <div className="preview-summary-card">
                <strong>{minimumIssues.length}</strong>
                <span>{minimumIssues.length === 1 ? "guidance note" : "guidance notes"}</span>
              </div>
              <div className="preview-summary-card">
                <strong>{feedbackData.groceryList.length}</strong>
                <span>{feedbackData.groceryList.length === 1 ? "grocery item" : "grocery items"}</span>
              </div>
              <div className="preview-summary-card">
                <strong>{feedbackGroceryGroups.length}</strong>
                <span>{feedbackGroceryGroups.length === 1 ? "grocery group" : "grocery groups"}</span>
              </div>
            </div>
            <div className="mini-panel">
              <h3>Needs Attention</h3>
              {blockingIssues.length === 0 ? (
                <p>No blocking rule issues in this preview.</p>
              ) : (
                <ul className="plain-list">
                  {blockingIssues.map((issue) => (
                    <li key={`${issue.code}-${issue.mealId ?? issue.categorySlug ?? issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mini-panel">
              <h3>Guidance</h3>
              {minimumIssues.length === 0 ? (
                <p>No guidance-only reminders in this preview.</p>
              ) : (
                <ul className="plain-list">
                  {minimumIssues.map((issue) => (
                    <li key={`${issue.code}-${issue.mealId ?? issue.categorySlug ?? issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              )}
              <p className="muted-text">Guidance helps balance the week and does not block saving.</p>
            </div>
            <div className="mini-panel">
              <h3>Grocery Snapshot</h3>
              <p className="muted-text">
                {feedbackData.groceryList.length === 0
                  ? "No grouped items yet."
                  : `Previewing ${feedbackData.groceryList.length} items across ${feedbackGroceryGroups.length} groups.`}
              </p>
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
      </Modal>
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
