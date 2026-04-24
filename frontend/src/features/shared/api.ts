const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api").replace(/\/$/, "");

export type IconManifestEntry = {
  id: string;
  name: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  aiGenerated?: boolean;
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
  slotSlugs: string[];
  weeklyMinCount?: number;
  weeklyMaxCount?: number;
  mealCount: number;
};

export type ApiPlanSlot = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isEnabled: boolean;
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
  categorySlotSlugs?: string[];
  categoryWeeklyMinCount?: number;
  categoryWeeklyMaxCount?: number;
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
  slot: string;
  slotSlug: string;
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
  categorySlug?: string;
  planSlotSlug?: string;
};

export type ApiGroceryUsage = {
  day: ApiPlanSelection["day"];
  slotName: string;
  slotSlug: string;
  mealName: string;
  mealId: string;
};

export type ApiGroceryListItem = {
  name: string;
  group: "protein" | "carb" | "veg" | "fruit" | "extras";
  quantityLabels: string[];
  storeTags: string[];
  usedInMeals: string[];
  usedIn: ApiGroceryUsage[];
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

export type ApiCategoryPayload = {
  name: string;
  slug: string;
  iconId?: string | null;
  slotSlugs?: string[];
  weeklyMinCount?: number | null;
  weeklyMaxCount?: number | null;
};

export function createCategory(payload: ApiCategoryPayload) {
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

export function updateCategory(categoryId: string, payload: ApiCategoryPayload) {
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

export function getPlanSlots() {
  return fetchJson<{ planSlots: ApiPlanSlot[] }>("/plan-slots");
}

export type ApiPlanSlotPayload = {
  name: string;
  slug: string;
  sortOrder?: number;
  isEnabled?: boolean;
};

export function createPlanSlot(payload: ApiPlanSlotPayload) {
  return fetch(apiUrl("/plan-slots"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { planSlot: ApiPlanSlot; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Meal slot create failed: ${response.status}`);
    }

    return data;
  });
}

export function updatePlanSlot(planSlotId: string, payload: ApiPlanSlotPayload) {
  return fetch(apiUrl(`/plan-slots/${planSlotId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const data = (await response.json()) as { planSlot: ApiPlanSlot; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Meal slot update failed: ${response.status}`);
    }

    return data;
  });
}

export function reorderPlanSlots(planSlotIds: string[]) {
  return fetch(apiUrl("/plan-slots/reorder"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ planSlotIds }),
  }).then(async (response) => {
    const data = (await response.json()) as { planSlots: ApiPlanSlot[]; message?: string };

    if (!response.ok) {
      throw new Error(data.message ?? `Meal slot reorder failed: ${response.status}`);
    }

    return data;
  });
}

export function deletePlanSlot(planSlotId: string) {
  return fetch(apiUrl(`/plan-slots/${planSlotId}`), {
    method: "DELETE",
  }).then(async (response) => {
    if (response.status === 204) {
      return;
    }

    const data = (await response.json()) as { message?: string };
    throw new Error(data.message ?? `Meal slot delete failed: ${response.status}`);
  });
}

export function deleteCategory(categoryId: string, replacementCategoryId?: string) {
  const params = new URLSearchParams();

  if (replacementCategoryId) {
    params.set("replacementCategoryId", replacementCategoryId);
  }

  const path = `/categories/${categoryId}${params.toString() ? `?${params.toString()}` : ""}`;

  return fetch(apiUrl(path), {
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

export function getWeeklyPlan(weekStartDate: string, filters?: { slotSlugs?: string[] }) {
  const params = new URLSearchParams();

  if (filters?.slotSlugs && filters.slotSlugs.length > 0) {
    params.set("slotSlugs", filters.slotSlugs.join(","));
  }

  const query = params.toString();

  return fetch(apiUrl(`/weekly-plans/${weekStartDate}${query ? `?${query}` : ""}`)).then(async (response) => {
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

export function previewWeeklyPlan(payload: {
  weekStartDate: string;
  selections: Array<{ day: string; slotSlug: string; mealId: string }>;
}) {
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

export function saveWeeklyPlan(payload: {
  weekStartDate: string;
  selections: Array<{ day: string; slotSlug: string; mealId: string }>;
}) {
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
