import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getMeals, previewWeeklyPlan, type ApiMeal } from "../shared/api";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function PlanScreen() {
  const mealsQuery = useQuery({
    queryKey: ["meals", "plan-screen"],
    queryFn: () => getMeals({}),
  });
  const meals = mealsQuery.data?.meals ?? [];

  const [selections, setSelections] = useState<Record<(typeof weekdays)[number], string>>({
    Monday: "",
    Tuesday: "",
    Wednesday: "",
    Thursday: "",
    Friday: "",
    Saturday: "",
    Sunday: "",
  });

  const preview = useMutation({
    mutationFn: () =>
      previewWeeklyPlan({
        weekStartDate: getUpcomingMondayIso(),
        selections: weekdays
          .filter((day) => selections[day])
          .map((day) => ({ day, mealId: selections[day] as string })),
      }),
  });

  const mealById = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);

  return (
    <div className="screen-layout">
      <SectionCard
        title="Weekly Plan"
        subtitle="Build the week from a single phone-friendly surface, then preview grocery output before saving anything."
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => preview.mutate()}
            disabled={preview.isPending || meals.length === 0}
          >
            {preview.isPending ? "Previewing..." : "Preview Week"}
          </button>
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
                  <select
                    value={selections[day]}
                    onChange={(event) =>
                      setSelections((current) => ({
                        ...current,
                        [day]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose a meal</option>
                    {meals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))}
                  </select>
                  {selectedMeal ? <MealSummaryChip meal={selectedMeal} /> : null}
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
        {preview.data ? (
          <div className="preview-grid">
            <div className="mini-panel">
              <h3>Validation</h3>
              {preview.data.validationIssues.length === 0 ? (
                <p>No rule violations in this preview.</p>
              ) : (
                <ul className="plain-list">
                  {preview.data.validationIssues.map((issue) => (
                    <li key={`${issue.code}-${issue.mealId ?? issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mini-panel">
              <h3>Grocery Snapshot</h3>
              {preview.data.groceryList.length === 0 ? (
                <p>No grocery items generated yet.</p>
              ) : (
                <ul className="plain-list">
                  {preview.data.groceryList.slice(0, 8).map((item) => (
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
