import { useMutation, useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { getMeals, previewWeeklyPlan } from "../shared/api";

export function GroceryScreen() {
  const mealsQuery = useQuery({
    queryKey: ["meals", "grocery-screen"],
    queryFn: () => getMeals({}),
  });

  const preview = useMutation({
    mutationFn: async () => {
      const meals = mealsQuery.data?.meals ?? [];
      return previewWeeklyPlan({
        weekStartDate: getUpcomingMondayIso(),
        selections: meals.slice(0, 3).map((meal, index) => ({
          day: ["Monday", "Tuesday", "Wednesday"][index] ?? "Monday",
          mealId: meal.id,
        })),
      });
    },
  });

  return (
    <div className="screen-layout">
      <SectionCard
        title="Grocery Preview"
        subtitle="This screen will eventually become the practical shopping companion. For now it previews grouped items from a sample plan."
        actions={
          <button type="button" className="primary-button" onClick={() => preview.mutate()} disabled={preview.isPending}>
            {preview.isPending ? "Generating..." : "Generate Sample"}
          </button>
        }
      >
        {preview.data ? (
          <div className="grocery-group-list">
            {preview.data.groceryList.map((item) => (
              <article key={`${item.group}-${item.name}`} className="grocery-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.group}</p>
                </div>
                <small>{item.storeTags.join(", ") || "Unassigned store"}</small>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No grocery preview yet"
            message="Generate a sample preview to see how the backend grocery grouping reads in the mobile UI."
          />
        )}
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
