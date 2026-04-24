import { expect, type Page, test } from "@playwright/test";

const planSlots = [
  { id: "plan_slot_breakfast", name: "Breakfast", slug: "breakfast", sortOrder: 0, isEnabled: true },
  { id: "plan_slot_lunch", name: "Lunch", slug: "lunch", sortOrder: 1, isEnabled: true },
  { id: "plan_slot_dinner", name: "Dinner", slug: "dinner", sortOrder: 2, isEnabled: true },
];

const categories = [
  { id: "cat_pasta", name: "Pasta", slug: "pasta-night", iconId: "168", slotSlugs: ["lunch", "dinner"] },
  { id: "cat_rice", name: "Rice Bowls", slug: "rice-bowls", iconId: "115", slotSlugs: ["lunch", "dinner"] },
  { id: "cat_chicken", name: "Chicken", slug: "chicken-night", iconId: "160", slotSlugs: ["lunch", "dinner"] },
  { id: "cat_wraps", name: "Wraps & Tortillas", slug: "taco-night", iconId: "77", slotSlugs: ["breakfast", "lunch", "dinner"] },
  { id: "cat_sandwiches", name: "Sandwiches", slug: "sandwich-night", iconId: "ai-blt", slotSlugs: ["breakfast", "lunch", "dinner"] },
  { id: "cat_snacks", name: "Snack Plates", slug: "snack-plate", iconId: "ai-snackplate", slotSlugs: ["breakfast", "lunch", "dinner"] },
  { id: "cat_pancakes", name: "Pancakes & Waffles", slug: "breakfast-dinner", iconId: "71", slotSlugs: ["breakfast", "lunch", "dinner"] },
  { id: "cat_bagel", name: "Bagel Bar", slug: "bagel-bar", iconId: "73", slotSlugs: ["breakfast", "lunch"] },
  { id: "cat_cereal", name: "Cereal Bowl", slug: "cereal-bowl", iconId: "256", slotSlugs: ["breakfast"] },
  { id: "cat_yogurt", name: "Fruit & Yogurt", slug: "fruit-yogurt", iconId: "369", slotSlugs: ["breakfast"] },
  { id: "cat_toast", name: "Toast & Toppings", slug: "toast-toppings", iconId: "79", slotSlugs: ["breakfast"] },
  { id: "cat_pizza", name: "Pizza", slug: "pizza-night", iconId: "178", slotSlugs: ["lunch", "dinner"] },
  {
    id: "cat_special",
    name: "Special Dinner",
    slug: "special-dinner",
    iconId: "ai-steak",
    slotSlugs: ["dinner"],
    weeklyMaxCount: 1,
  },
];

const meals = [
  meal("meal_pancakes", "pancakes-and-berries", "Pancakes and Berries", "Pancakes & Waffles", "breakfast-dinner", "71"),
  meal("meal_bagel", "bagel-cream-cheese-bar", "Bagel Cream Cheese Bar", "Bagel Bar", "bagel-bar", "73"),
  meal("meal_cereal", "cereal-and-milk", "Cereal and Milk", "Cereal Bowl", "cereal-bowl", "256"),
  meal("meal_turkey", "turkey-cheese-sandwich", "Turkey & Cheese Sandwich", "Sandwiches", "sandwich-night", "ai-blt"),
  meal("meal_rice", "soy-chicken-rice-bowl", "Soy Chicken Rice Bowl", "Rice Bowls", "rice-bowls", "115"),
  meal("meal_pizza_lunch", "mini-pizza-lunch", "Mini Pizza Lunch", "Pizza", "pizza-night", "178"),
  meal("meal_spaghetti", "spaghetti-night", "Spaghetti Night", "Pasta", "pasta-night", "168"),
  meal("meal_chicken", "chicken-nugget-night", "Chicken Nugget Night", "Chicken", "chicken-night", "160"),
  meal("meal_steak", "steak-dinner", "Steak Dinner", "Special Dinner", "special-dinner", "ai-steak", "premium"),
];

const storeTags = [
  { id: "store_costco", name: "Costco", slug: "costco" },
  { id: "store_cub", name: "Cub", slug: "cub" },
  { id: "store_other", name: "Other", slug: "other" },
];

const weeklyPlan = {
  id: "plan_demo",
  weekStartDate: "2026-04-27T00:00:00.000Z",
  selections: [
    { day: "Monday", slot: "Breakfast", slotSlug: "breakfast", mealId: "meal_pancakes" },
    { day: "Monday", slot: "Lunch", slotSlug: "lunch", mealId: "meal_turkey" },
    { day: "Monday", slot: "Dinner", slotSlug: "dinner", mealId: "meal_spaghetti" },
    { day: "Tuesday", slot: "Breakfast", slotSlug: "breakfast", mealId: "meal_bagel" },
    { day: "Tuesday", slot: "Lunch", slotSlug: "lunch", mealId: "meal_rice" },
    { day: "Tuesday", slot: "Dinner", slotSlug: "dinner", mealId: "meal_chicken" },
  ],
};

const groceryList = [
  groceryItem("Pancake Mix", "carb", ["1 box"], ["Pancakes and Berries"], weeklyPlan.selections[0]),
  groceryItem("Bread", "carb", ["1 loaf"], ["Turkey & Cheese Sandwich"], weeklyPlan.selections[1]),
  groceryItem("Rice", "carb", ["2 cups"], ["Soy Chicken Rice Bowl"], weeklyPlan.selections[4]),
  groceryItem("Spaghetti", "carb", ["1 box"], ["Spaghetti Night"], weeklyPlan.selections[2]),
  groceryItem("Chicken Nuggets", "protein", ["1 bag"], ["Chicken Nugget Night"], weeklyPlan.selections[5]),
];

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("captures desktop UI review screenshots for core screens", async ({ page }) => {
  const screens = [
    { path: "/plan", title: "Weekly Plan" },
    { path: "/meals", title: "Meal Library" },
    { path: "/grocery", title: "Grocery List" },
    { path: "/settings", title: "Settings" },
    { path: "/magnets", title: "Magnet Export" },
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    await expect(page.getByRole("heading", { name: screen.title })).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath(`${screen.path.slice(1)}-desktop-full-page.png`),
      fullPage: true,
    });
  }
});

test("uses category-first planning and shows preview feedback in a modal", async ({ page }) => {
  await page.goto("/plan");

  await expect(page.locator('select[aria-label="Monday Breakfast meal"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.locator('select[aria-label="Monday Breakfast meal"]')).toBeVisible();

  const mealSelect = page.locator('select[aria-label="Wednesday Breakfast meal"]');
  await expect(mealSelect).toHaveCount(0);

  await page
    .locator('[aria-label="Wednesday Breakfast category"]')
    .getByRole("button", { name: "Bagel Bar" })
    .click();

  await expect(page.locator('select[aria-label="Wednesday Breakfast meal"]')).toBeVisible();

  await page.getByRole("button", { name: "Preview Week" }).click();

  const previewDialog = page.getByRole("dialog", { name: "Preview Feedback" });
  await expect(previewDialog).toBeVisible();
  await expect(page.getByText("Latest preview")).toBeVisible();
  await expect(page.getByText(/1 blocking issue/i)).toBeVisible();
  await expect(previewDialog.getByRole("heading", { name: "Needs Attention" })).toBeVisible();
  await expect(previewDialog.getByRole("heading", { name: "Guidance" })).toBeVisible();
  await expect(previewDialog.getByRole("heading", { name: "Grocery Snapshot" })).toBeVisible();
  await expect(previewDialog.getByText(/blocking issue/i)).toBeVisible();

  await previewDialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(previewDialog).toHaveCount(0);
  await page.getByRole("button", { name: "View details" }).click();
  await expect(previewDialog).toBeVisible();
});

function meal(
  id: string,
  slug: string,
  name: string,
  category: string,
  categorySlug: string,
  categoryIconId: string,
  costTier: "budget" | "standard" | "premium" = "budget",
) {
  return {
    id,
    slug,
    name,
    category,
    categorySlug,
    categoryIconId,
    categorySlotSlugs: categories.find((candidate) => candidate.slug === categorySlug)?.slotSlugs ?? ["dinner"],
    costTier,
    kidFavorite: costTier !== "premium",
    lowEffort: true,
    notes: "Seeded UI review meal.",
    ingredients: [
      { name: "Protein", group: "protein", storeTag: "Costco", storeTagSlug: "costco", quantityLabel: "1 pack" },
      { name: "Fruit", group: "fruit", storeTag: "Cub", storeTagSlug: "cub", quantityLabel: "1 serving" },
    ],
  };
}

function groceryItem(
  name: string,
  group: "protein" | "carb" | "veg" | "fruit" | "extras",
  quantityLabels: string[],
  usedInMeals: string[],
  selection: { day: string; slot: string; slotSlug: string; mealId: string },
) {
  return {
    name,
    group,
    quantityLabels,
    storeTags: ["Costco"],
    usedInMeals,
    usedIn: [
      {
        day: selection.day,
        slotName: selection.slot,
        slotSlug: selection.slotSlug,
        mealName: usedInMeals[0],
        mealId: selection.mealId,
      },
    ],
  };
}

async function mockApi(page: Page) {
  await page.route("http://localhost:3001/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api", "");

    if (path === "/weekly-plans/preview") {
      await route.fulfill({
        json: {
          preview: {
            weekStartDate: weeklyPlan.weekStartDate,
            selections: weeklyPlan.selections,
          },
          validationIssues: [
            {
              code: "meal_repeat_limit_exceeded",
              mealId: "meal_spaghetti",
              message: 'Meal "Spaghetti Night" exceeds the weekly repeat limit.',
            },
          ],
          groceryList,
          persisted: false,
        },
      });
      return;
    }

    if (path === "/plan-slots") {
      await route.fulfill({ json: { planSlots } });
      return;
    }

    if (path === "/categories") {
      await route.fulfill({ json: { categories } });
      return;
    }

    if (path === "/store-tags") {
      await route.fulfill({ json: { storeTags } });
      return;
    }

    if (path === "/meals") {
      await route.fulfill({ json: { meals } });
      return;
    }

    if (path.startsWith("/weekly-plans/")) {
      await route.fulfill({
        json: {
          weeklyPlan,
          validationIssues: [],
          groceryList: filterGroceryBySlots(url.searchParams.get("slotSlugs")),
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Unhandled mock API path: ${path}` } });
  });
}

function filterGroceryBySlots(slotSlugs: string | null) {
  if (!slotSlugs) {
    return groceryList;
  }

  const selectedSlotSlugs = new Set(slotSlugs.split(",").filter(Boolean));

  return groceryList.filter((item) => item.usedIn.some((usage) => selectedSlotSlugs.has(usage.slotSlug)));
}
