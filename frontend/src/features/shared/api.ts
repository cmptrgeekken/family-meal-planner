const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");

export type IconManifestEntry = {
  id: string;
  name: string;
  slug: string;
  confidence: "high" | "medium" | "low";
};

export type IconManifest = {
  schemaVersion: number;
  assetBasePath: string;
  description: string;
  icons: IconManifestEntry[];
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  iconId?: string;
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
  categoryIconId?: string;
  costTier: "budget" | "standard" | "premium";
  kidFavorite: boolean;
  lowEffort: boolean;
  notes?: string;
  ingredients: ApiMealIngredient[];
};

export type ApiMealPayload = {
  name: string;
  slug: string;
  categorySlug: string;
  costTier: ApiMeal["costTier"];
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

export type ApiWeeklyPlan = {
  id: string;
  weekStartDate: string;
  selections: ApiPlanSelection[];
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

export function getIconManifest() {
  return fetch("/icons/manifest.json").then(async (response) => {
    if (!response.ok) {
      throw new Error(`Icon manifest request failed: ${response.status}`);
    }

    return (await response.json()) as IconManifest;
  });
}

export function getCategories() {
  return fetchJson<{ categories: ApiCategory[] }>("/categories");
}

export function createCategory(payload: { name: string; slug: string; iconId?: string | null }) {
  return fetch(apiUrl("/categories"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { category: ApiCategory; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Category create failed: ${response.status}`);
    }

    return data;
  });
}

export function updateCategory(categoryId: string, payload: { name: string; slug: string; iconId?: string | null }) {
  return fetch(apiUrl(`/categories/${categoryId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { category: ApiCategory; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Category update failed: ${response.status}`);
    }

    return data;
  });
}

export function deleteCategory(categoryId: string) {
  return fetch(apiUrl(`/categories/${categoryId}`), {
    method: "DELETE",
  }).then(async (response) => {
    if (response.status === 204) {
      return;
    }

    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? `Category delete failed: ${response.status}`);
  });
}

export function getStoreTags() {
  return fetchJson<{ storeTags: ApiStoreTag[] }>("/store-tags");
}

export function createStoreTag(payload: { name: string; slug: string }) {
  return fetch(apiUrl("/store-tags"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { storeTag: ApiStoreTag; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Store tag create failed: ${response.status}`);
    }

    return data;
  });
}

export function updateStoreTag(storeTagId: string, payload: { name: string; slug: string }) {
  return fetch(apiUrl(`/store-tags/${storeTagId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { storeTag: ApiStoreTag; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Store tag update failed: ${response.status}`);
    }

    return data;
  });
}

export function deleteStoreTag(storeTagId: string) {
  return fetch(apiUrl(`/store-tags/${storeTagId}`), {
    method: "DELETE",
  }).then(async (response) => {
    if (response.status === 204) {
      return;
    }

    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? `Store tag delete failed: ${response.status}`);
  });
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

export function createMeal(payload: ApiMealPayload) {
  return fetch(apiUrl("/meals"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { meal: ApiMeal; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Meal create failed: ${response.status}`);
    }

    return data;
  });
}

export function updateMeal(mealId: string, payload: ApiMealPayload) {
  return fetch(apiUrl(`/meals/${mealId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { meal: ApiMeal; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Meal update failed: ${response.status}`);
    }

    return data;
  });
}

export function deleteMeal(mealId: string) {
  return fetch(apiUrl(`/meals/${mealId}`), {
    method: "DELETE",
  }).then(async (response) => {
    if (response.status === 204) {
      return;
    }

    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? `Meal delete failed: ${response.status}`);
  });
}

export function getWeeklyPlan(weekStartDate: string) {
  return fetch(apiUrl(`/weekly-plans/${weekStartDate}`)).then(async (response) => {
    if (response.status === 404) {
      return null;
    }

    const data = (await response.json()) as {
      weeklyPlan: ApiWeeklyPlan;
      validationIssues: ApiValidationIssue[];
      groceryList: ApiGroceryListItem[];
      message?: string;
    };

    if (!response.ok) {
      throw new Error(data.message ?? `Weekly plan request failed: ${response.status}`);
    }

    return data;
  });
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

export function saveWeeklyPlan(payload: { weekStartDate: string; selections: Array<{ day: string; mealId: string }> }) {
  return fetch(apiUrl(`/weekly-plans/${payload.weekStartDate}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ selections: payload.selections }),
  }).then(async (response) => {
    const data = (await response.json()) as {
      weeklyPlan?: ApiWeeklyPlan;
      validationIssues?: ApiValidationIssue[];
      groceryList?: ApiGroceryListItem[];
      message?: string;
    };

    if (!response.ok) {
      throw new Error(data.message ?? `Weekly plan save failed: ${response.status}`);
    }

    return data as {
      weeklyPlan: ApiWeeklyPlan;
      validationIssues: ApiValidationIssue[];
      groceryList: ApiGroceryListItem[];
    };
  });
}
