import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { getCategories, getMeals, getStoreTags } from "../shared/api";

export function MealsScreen() {
  const [filters, setFilters] = useState({
    categorySlug: "",
    storeTagSlug: "",
    kidFavorite: false,
    lowEffort: false,
  });

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

  return (
    <div className="screen-layout">
      <SectionCard title="Meal Browser" subtitle="Use filter chips and quick toggles to narrow the list fast on a phone.">
        <div className="filter-stack">
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

          <div className="toggle-row">
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
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Results" subtitle="Meal cards are intentionally compact and thumb-friendly for quick picking.">
        {mealsQuery.isLoading ? <p>Loading meals...</p> : null}
        {!mealsQuery.isLoading && (mealsQuery.data?.meals.length ?? 0) === 0 ? (
          <EmptyState title="No matching meals" message="Try clearing one or more filters." />
        ) : null}
        <div className="meal-card-grid">
          {mealsQuery.data?.meals.map((meal) => (
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
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
