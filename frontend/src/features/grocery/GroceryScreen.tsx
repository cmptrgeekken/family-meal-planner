import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getPlanSlots, getWeeklyPlan, type ApiGroceryListItem, type ApiPlanSlot, type ApiWeeklyPlan } from "../shared/api";

type GroceryScreenProps = {
  weekStartDate: string;
};

type GroceryStoreSection = {
  storeName: string;
  itemCount: number;
  groups: Array<{
    group: ApiGroceryListItem["group"];
    items: ApiGroceryListItem[];
  }>;
};

const groceryGroupLabels: Record<ApiGroceryListItem["group"], string> = {
  protein: "Protein",
  carb: "Carbs",
  veg: "Vegetables",
  fruit: "Fruit",
  extras: "Extras",
};

const groceryGroupOrder = Object.keys(groceryGroupLabels) as Array<ApiGroceryListItem["group"]>;

export function GroceryScreen({ weekStartDate }: GroceryScreenProps) {
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
  const groceryStoreSections = useMemo(() => getGroceryStoreSections(groceryList), [groceryList]);

  useEffect(() => {
    setSelectedSlotSlugs(new Set());
  }, [weekStartDate]);

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
                <strong>{groceryStoreSections.length}</strong>
                <span>{groceryStoreSections.length === 1 ? "store section" : "store sections"}</span>
              </div>
              <div className="grocery-summary-card">
                <strong>{selectedSlotSlugs.size}</strong>
                <span>{selectedSlotSlugs.size === 1 ? "meal slot shown" : "meal slots shown"}</span>
              </div>
            </div>
            <div className="grocery-progress-bar" aria-hidden="true">
              <span style={{ width: `${groceryList.length === 0 ? 0 : (checkedCount / groceryList.length) * 100}%` }} />
            </div>
            <div className="grocery-store-list">
              {groceryStoreSections.map((storeSection) => {
                const storeHeadingId = `store-${storeSection.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

                return (
                  <section key={storeSection.storeName} className="grocery-store-section" aria-labelledby={storeHeadingId}>
                    <div className="grocery-store-heading">
                      <h3 id={storeHeadingId}>{storeSection.storeName}</h3>
                      <span className="pill-muted">
                        {storeSection.itemCount} {storeSection.itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="grocery-aisle-list">
                      {storeSection.groups.map((groupSection) => (
                        <section key={`${storeSection.storeName}-${groupSection.group}`} className="grocery-aisle-section">
                          <h4>{groceryGroupLabels[groupSection.group]}</h4>
                          <div className="grocery-group-list">
                            {groupSection.items.map((item) => {
                              const itemKey = getGroceryItemKey(item.group, item.name);
                              const isChecked = checkedItems.has(itemKey);
                              const usageDetails = getUsageDetails(item);

                              return (
                                <article key={itemKey} className={isChecked ? "grocery-item grocery-item-checked" : "grocery-item"}>
                                  <label className="shopping-check">
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleCheckedItem(itemKey)} />
                                    <span className="sr-only">Mark {item.name} as shopped</span>
                                  </label>
                                  <div className="grocery-item-copy">
                                    <div className="grocery-item-title-row">
                                      <strong>{item.name}</strong>
                                      <button
                                        type="button"
                                        className="grocery-info-button"
                                        title={usageDetails}
                                        aria-label={`Why ${item.name} is on the list`}
                                      >
                                        ?
                                      </button>
                                    </div>
                                    <p>{item.quantityLabels.length > 0 ? item.quantityLabels.join(", ") : "Quantity as needed"}</p>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
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

export function getGrocerySlotOptions(planSlots: ApiPlanSlot[], weeklyPlan?: ApiWeeklyPlan) {
  if (!weeklyPlan) {
    return [];
  }

  const slotBySlug = new Map(planSlots.map((slot) => [slot.slug, slot]));
  const slotOptions = new Map<string, { slug: string; name: string; sortOrder: number; isEnabled: boolean }>();

  for (const slot of planSlots) {
    if (!slot.isEnabled) {
      continue;
    }

    slotOptions.set(slot.slug, {
      slug: slot.slug,
      name: slot.name,
      sortOrder: slot.sortOrder,
      isEnabled: slot.isEnabled,
    });
  }

  for (const selection of weeklyPlan.selections) {
    const slot = slotBySlug.get(selection.slotSlug);
    if (!slotOptions.has(selection.slotSlug)) {
      slotOptions.set(selection.slotSlug, {
        slug: selection.slotSlug,
        name: slot?.name ?? selection.slot,
        sortOrder: slot?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        isEnabled: slot?.isEnabled ?? false,
      });
    }
  }

  return [...slotOptions.values()].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

export function getGroceryStoreSections(groceryList: ApiGroceryListItem[]): GroceryStoreSection[] {
  const stores = new Map<string, Map<ApiGroceryListItem["group"], ApiGroceryListItem[]>>();

  for (const item of groceryList) {
    const storeName = getStoreSectionName(item.storeTags);
    const storeGroups = stores.get(storeName) ?? new Map<ApiGroceryListItem["group"], ApiGroceryListItem[]>();
    const groupItems = storeGroups.get(item.group) ?? [];

    storeGroups.set(item.group, [...groupItems, item]);
    stores.set(storeName, storeGroups);
  }

  return [...stores.entries()]
    .sort(([left], [right]) => compareStoreNames(left, right))
    .map(([storeName, groups]) => ({
      storeName,
      itemCount: [...groups.values()].reduce((count, items) => count + items.length, 0),
      groups: [...groups.entries()]
        .sort(([left], [right]) => groceryGroupOrder.indexOf(left) - groceryGroupOrder.indexOf(right))
        .map(([group, items]) => ({
          group,
          items: [...items].sort((left, right) => left.name.localeCompare(right.name)),
        })),
    }));
}

function getStoreSectionName(storeTags: string[]) {
  if (storeTags.length === 0) {
    return "Unassigned store";
  }

  if (storeTags.length > 1) {
    return "Multiple stores";
  }

  return storeTags[0] ?? "Unassigned store";
}

function compareStoreNames(left: string, right: string) {
  if (left === "Unassigned store") {
    return 1;
  }

  if (right === "Unassigned store") {
    return -1;
  }

  if (left === "Multiple stores") {
    return 1;
  }

  if (right === "Multiple stores") {
    return -1;
  }

  return left.localeCompare(right);
}

function getUsageDetails(item: ApiGroceryListItem) {
  return `Included for ${formatUsageList(item.usedIn)}${item.quantityLabels.length > 0 ? ` (${item.quantityLabels.join(", ")})` : ""}.`;
}

function formatUsageList(usedIn: Array<{ day: string; slotName: string; mealName: string }>) {
  if (usedIn.length === 0) {
    return "saved meals";
  }

  return usedIn.map((usage) => `${usage.day} ${usage.slotName} (${usage.mealName})`).join(", ");
}
