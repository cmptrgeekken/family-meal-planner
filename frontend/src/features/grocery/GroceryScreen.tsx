import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getPlanSlots, getWeeklyPlan, type ApiPlanSlot, type ApiWeeklyPlan } from "../shared/api";

export function GroceryScreen() {
  const weekStartDate = useMemo(getUpcomingMondayIso, []);
  const [selectedSlotSlugs, setSelectedSlotSlugs] = useState<Set<string>>(new Set());
  const slotFilterKey = [...selectedSlotSlugs].sort().join(",");
  const storageKey = `family-meal-planner:grocery-checked:${weekStartDate}:${slotFilterKey || "all"}`;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const planSlotsQuery = useQuery({
    queryKey: ["plan-slots"],
    queryFn: getPlanSlots,
  });
  const weeklyPlanQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate],
    queryFn: () => getWeeklyPlan(weekStartDate),
  });
  const slotOptions = useMemo(
    () => getGrocerySlotOptions(planSlotsQuery.data?.planSlots ?? [], weeklyPlanQuery.data?.weeklyPlan),
    [planSlotsQuery.data?.planSlots, weeklyPlanQuery.data?.weeklyPlan],
  );
  const groceryQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate, "grocery", slotFilterKey],
    queryFn: () => getWeeklyPlan(weekStartDate, { slotSlugs: [...selectedSlotSlugs] }),
    enabled: selectedSlotSlugs.size > 0,
  });
  const groceryList = groceryQuery.data?.groceryList ?? [];
  const checkedCount = groceryList.filter((item) => checkedItems.has(getGroceryItemKey(item.group, item.name))).length;
  const groceryGroups = useMemo(() => Array.from(new Set(groceryList.map((item) => item.group))), [groceryList]);

  useEffect(() => {
    if (selectedSlotSlugs.size > 0 || slotOptions.length === 0) {
      return;
    }

    setSelectedSlotSlugs(new Set(slotOptions.map((slot) => slot.slug)));
  }, [selectedSlotSlugs.size, slotOptions]);

  useEffect(() => {
    try {
      setCheckedItems(new Set(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[]));
    } catch {
      setCheckedItems(new Set());
    }
  }, [storageKey]);

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

  function toggleSlot(slotSlug: string) {
    setSelectedSlotSlugs((current) => {
      if (current.size === 1 && current.has(slotSlug)) {
        return current;
      }

      const next = new Set(current);

      if (next.has(slotSlug)) {
        next.delete(slotSlug);
      } else {
        next.add(slotSlug);
      }

      return next;
    });
  }

  return (
    <div className="screen-layout grocery-screen-layout">
      <SectionCard
        title="Grocery List"
        subtitle={`Generated from the saved plan for the week of ${weekStartDate}. ${checkedCount}/${groceryList.length} checked.`}
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
              onClick={() => void groceryQuery.refetch()}
              disabled={groceryQuery.isFetching || selectedSlotSlugs.size === 0}
            >
              {groceryQuery.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      >
        {weeklyPlanQuery.isError || groceryQuery.isError ? (
          <StatusMessage
            tone="error"
            title="Grocery list unavailable"
            message="The saved weekly plan could not be loaded."
          />
        ) : null}
        {weeklyPlanQuery.isLoading || planSlotsQuery.isLoading || groceryQuery.isLoading ? (
          <p>Loading saved grocery list...</p>
        ) : null}
        {!weeklyPlanQuery.isLoading && !weeklyPlanQuery.data ? (
          <EmptyState
            title="No saved week yet"
            message="Save a weekly plan from the Plan screen, then come back here for the grocery list."
          />
        ) : null}
        {slotOptions.length > 0 ? (
          <div className="slot-filter-row" aria-label="Grocery meal slot filters">
            {slotOptions.map((slot) => (
              <label key={slot.slug} className="filter-chip slot-filter-chip">
                <input
                  type="checkbox"
                  checked={selectedSlotSlugs.has(slot.slug)}
                  disabled={selectedSlotSlugs.size === 1 && selectedSlotSlugs.has(slot.slug)}
                  onChange={() => toggleSlot(slot.slug)}
                />
                <span>{slot.name}</span>
              </label>
            ))}
          </div>
        ) : null}
        {weeklyPlanQuery.data && !groceryQuery.isLoading && groceryList.length === 0 ? (
          <EmptyState
            title="No grocery items"
            message="The saved week exists, but the selected meal slots do not have grocery ingredients yet."
          />
        ) : null}
        {groceryList.length > 0 ? (
          <>
            <div className="grocery-summary-grid" aria-label="Grocery summary">
              <div className="grocery-summary-card">
                <strong>{groceryList.length}</strong>
                <span>{groceryList.length === 1 ? "item to shop" : "items to shop"}</span>
              </div>
              <div className="grocery-summary-card">
                <strong>{checkedCount}</strong>
                <span>{checkedCount === 1 ? "item checked" : "items checked"}</span>
              </div>
              <div className="grocery-summary-card">
                <strong>{groceryGroups.length}</strong>
                <span>{groceryGroups.length === 1 ? "ingredient group" : "ingredient groups"}</span>
              </div>
              <div className="grocery-summary-card">
                <strong>{selectedSlotSlugs.size}</strong>
                <span>{selectedSlotSlugs.size === 1 ? "meal slot shown" : "meal slots shown"}</span>
              </div>
            </div>
            <div className="grocery-progress-bar" aria-hidden="true">
              <span style={{ width: `${groceryList.length === 0 ? 0 : (checkedCount / groceryList.length) * 100}%` }} />
            </div>
            <div className="grocery-group-list grocery-item-grid">
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
                      <p className="muted-text">{getUsageSummary(item.usedIn)}</p>
                      <details className="grocery-diagnostics">
                        <summary>Why is this here?</summary>
                        <p>
                          Included because {formatUsageList(item.usedIn)} use {item.name}
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

function getGrocerySlotOptions(planSlots: ApiPlanSlot[], weeklyPlan?: ApiWeeklyPlan) {
  if (!weeklyPlan) {
    return [];
  }

  const slotBySlug = new Map(planSlots.map((slot) => [slot.slug, slot]));
  const slotOptions = new Map<string, { slug: string; name: string; sortOrder: number }>();

  for (const selection of weeklyPlan.selections) {
    const slot = slotBySlug.get(selection.slotSlug);
    slotOptions.set(selection.slotSlug, {
      slug: selection.slotSlug,
      name: slot?.name ?? selection.slot,
      sortOrder: slot?.sortOrder ?? Number.MAX_SAFE_INTEGER,
    });
  }

  return [...slotOptions.values()].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function getUsageSummary(usedIn: Array<{ day: string; slotName: string; mealName: string }>) {
  const slotNames = [...new Set(usedIn.map((usage) => usage.slotName))];
  const mealText = usedIn.length === 1 ? "1 meal" : `${usedIn.length} meals`;

  return `Used in ${mealText}${slotNames.length > 0 ? ` across ${slotNames.join(", ")}` : ""}.`;
}

function formatUsageList(usedIn: Array<{ day: string; slotName: string; mealName: string }>) {
  if (usedIn.length === 0) {
    return "saved meals";
  }

  return usedIn.map((usage) => `${usage.day} ${usage.slotName} (${usage.mealName})`).join(", ");
}

function getUpcomingMondayIso() {
  const current = new Date();
  const day = current.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  current.setDate(current.getDate() + daysUntilMonday);
  return current.toISOString().slice(0, 10);
}
