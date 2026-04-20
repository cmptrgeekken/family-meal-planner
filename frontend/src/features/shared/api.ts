const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ApiStoreTag = {
  id: string;
  name: string;
  slug: string;
};

export type ApiMealIngredient = {
  name: string;
  group: "protein" | "carb" | "veg" | "fruit" | "extras";
  storeTag?: string;
  storeTagSlug?: string;
  quantityLabel?: string;
};

export type ApiMeal = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  costTier: "budget" | "standard" | "premium";
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: ApiMealIngredient[];
};

export type ApiPlanSelection = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  slot: "Dinner";
  mealId: string;
};

export type ApiValidationIssue = {
  code: string;
  message: string;
  mealId?: string;
};

export type ApiGroceryListItem = {
  name: string;
  group: "protein" | "carb" | "veg" | "fruit" | "extras";
  quantityLabels: string[];
  storeTags: string[];
  usedInMeals: string[];
};

function apiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJson<T>(path: string) {
  const response = await fetch(apiUrl(path));

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getCategories() {
  return fetchJson<{ categories: ApiCategory[] }>("/categories");
}

export function getStoreTags() {
  return fetchJson<{ storeTags: ApiStoreTag[] }>("/store-tags");
}

export function getMeals(filters?: {
  categorySlug?: string;
  storeTagSlug?: string;
  kidFavorite?: boolean;
  lowEffort?: boolean;
}) {
  const params = new URLSearchParams();

  if (filters?.categorySlug) params.set("categorySlug", filters.categorySlug);
  if (filters?.storeTagSlug) params.set("storeTagSlug", filters.storeTagSlug);
  if (typeof filters?.kidFavorite === "boolean") params.set("kidFavorite", String(filters.kidFavorite));
  if (typeof filters?.lowEffort === "boolean") params.set("lowEffort", String(filters.lowEffort));

  const query = params.toString();

  return fetchJson<{ meals: ApiMeal[] }>(`/meals${query ? `?${query}` : ""}`);
}

export function previewWeeklyPlan(payload: { weekStartDate: string; selections: Array<{ day: string; mealId: string }> }) {
  return fetch(apiUrl("/weekly-plans/preview"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as {
      preview: { weekStartDate: string; selections: ApiPlanSelection[] };
      validationIssues: ApiValidationIssue[];
      groceryList: ApiGroceryListItem[];
      persisted: false;
    };

    if (!response.ok) {
      throw new Error(data && "message" in data ? String((data as { message?: string }).message) : "Preview failed");
    }

    return data;
  });
}
