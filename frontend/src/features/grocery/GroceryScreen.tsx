import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getWeeklyPlan } from "../shared/api";

export function GroceryScreen() {
  const weekStartDate = useMemo(getUpcomingMondayIso, []);
  const storageKey = `family-meal-planner:grocery-checked:${weekStartDate}`;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const weeklyPlanQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate, "grocery"],
    queryFn: () => getWeeklyPlan(weekStartDate),
  });
  const groceryList = weeklyPlanQuery.data?.groceryList ?? [];
  const checkedCount = groceryList.filter((item) => checkedItems.has(getGroceryItemKey(item.group, item.name))).length;

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
    } catch {
      // Shopping progress is a convenience; the grocery list still works without local storage.
    }
  }, [checkedItems, storageKey]);

  function toggleCheckedItem(itemKey: string) {
    setCheckedItems((current) => {
      const next = new Set(current);

      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }

      return next;
    });
  }

  return (
    <div className="screen-layout">
      <SectionCard
        title="Grocery List"
        subtitle={`Generated from the saved dinner plan for the week of ${weekStartDate}. ${checkedCount}/${groceryList.length} checked.`}
        actions={
          <div className="toggle-row grocery-action-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setCheckedItems(new Set())}
              disabled={checkedItems.size === 0}
            >
              Clear checks
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => void weeklyPlanQuery.refetch()}
              disabled={weeklyPlanQuery.isFetching}
            >
              {weeklyPlanQuery.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      >
        {weeklyPlanQuery.isError ? (
          <StatusMessage
            tone="error"
            title="Grocery list unavailable"
            message="The saved weekly plan could not be loaded."
          />
        ) : null}
        {weeklyPlanQuery.isLoading ? <p>Loading saved grocery list...</p> : null}
        {!weeklyPlanQuery.isLoading && !weeklyPlanQuery.data ? (
          <EmptyState
            title="No saved week yet"
            message="Save a weekly plan from the Plan screen, then come back here for the grocery list."
          />
        ) : null}
        {weeklyPlanQuery.data && groceryList.length === 0 ? (
          <EmptyState
            title="No grocery items"
            message="The saved week exists, but its selected meals do not have ingredients yet."
          />
        ) : null}
        {groceryList.length > 0 ? (
          <>
            <div className="grocery-progress-bar" aria-hidden="true">
              <span style={{ width: `${groceryList.length === 0 ? 0 : (checkedCount / groceryList.length) * 100}%` }} />
            </div>
            <div className="grocery-group-list">
              {groceryList.map((item) => {
                const itemKey = getGroceryItemKey(item.group, item.name);
                const isChecked = checkedItems.has(itemKey);

                return (
                  <article key={itemKey} className={isChecked ? "grocery-item grocery-item-checked" : "grocery-item"}>
                    <label className="shopping-check">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleCheckedItem(itemKey)} />
                      <span className="sr-only">Mark {item.name} as shopped</span>
                    </label>
                    <div className="grocery-item-copy">
                      <strong>{item.name}</strong>
                      <p>
                        {item.group}
                        {item.quantityLabels.length > 0 ? ` - ${item.quantityLabels.join(", ")}` : ""}
                      </p>
                      <p className="muted-text">Used in: {item.usedInMeals.join(", ")}</p>
                      <details className="grocery-diagnostics">
                        <summary>Why is this here?</summary>
                        <p>
                          Included because {item.usedInMeals.join(", ")} use {item.name}
                          {item.quantityLabels.length > 0 ? ` (${item.quantityLabels.join(", ")})` : ""}.
                        </p>
                      </details>
                    </div>
                    <small className="grocery-store-tag">{item.storeTags.join(", ") || "Unassigned store"}</small>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}

function getGroceryItemKey(group: string, name: string) {
  return `${group}:${name}`;
}

function getUpcomingMondayIso() {
  const current = new Date();
  const day = current.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  current.setDate(current.getDate() + daysUntilMonday);
  return current.toISOString().slice(0, 10);
}
