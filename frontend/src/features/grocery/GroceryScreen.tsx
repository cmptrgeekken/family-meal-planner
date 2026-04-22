import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { StatusMessage } from "../../components/StatusMessage";
import { getWeeklyPlan } from "../shared/api";

export function GroceryScreen() {
  const weekStartDate = useMemo(getUpcomingMondayIso, []);
  const weeklyPlanQuery = useQuery({
    queryKey: ["weekly-plan", weekStartDate, "grocery"],
    queryFn: () => getWeeklyPlan(weekStartDate),
  });
  const groceryList = weeklyPlanQuery.data?.groceryList ?? [];

  return (
    <div className="screen-layout">
      <SectionCard
        title="Grocery List"
        subtitle={`Generated from the saved dinner plan for the week of ${weekStartDate}.`}
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => void weeklyPlanQuery.refetch()}
            disabled={weeklyPlanQuery.isFetching}
          >
            {weeklyPlanQuery.isFetching ? "Refreshing..." : "Refresh"}
          </button>
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
          <div className="grocery-group-list">
            {groceryList.map((item) => (
              <article key={`${item.group}-${item.name}`} className="grocery-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.group}
                    {item.quantityLabels.length > 0 ? ` - ${item.quantityLabels.join(", ")}` : ""}
                  </p>
                  <p className="muted-text">Used in: {item.usedInMeals.join(", ")}</p>
                </div>
                <small>{item.storeTags.join(", ") || "Unassigned store"}</small>
              </article>
            ))}
          </div>
        ) : null}
      </SectionCard>
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
