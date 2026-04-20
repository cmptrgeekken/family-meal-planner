import { afterAll, beforeAll } from "vitest";

process.env.NODE_ENV = "test";

const defaultTestDatabaseUrl = "postgresql://mealplanner:mealplanner@localhost:5433/family_meal_planner_test";
const originalDatabaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl;

if (originalDatabaseUrl && originalDatabaseUrl === testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must point to a dedicated test database, not the primary application database.");
}

process.env.TEST_DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL = testDatabaseUrl;

let prisma: typeof import("../config/prisma.js").prisma;

const weeklyPlanDates = [
  "2099-04-27",
  "2099-05-04",
  "2099-06-01",
  "2099-06-08",
];

async function cleanupTestArtifacts() {
  if (!prisma) {
    return;
  }

  await prisma.weeklyPlan.deleteMany({
    where: {
      weekStartDate: {
        in: weeklyPlanDates.map((date) => new Date(date)),
      },
    },
  });

  await prisma.meal.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "test-artifact-meal-" } },
        { slug: { startsWith: "test-rice-bowl-" } },
        { name: { startsWith: "Test Rice Bowl " } },
      ],
    },
  });

  await prisma.ingredient.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "TEST__Rice " } },
        { name: { startsWith: "TEST__Chicken Thighs " } },
        { name: { startsWith: "Rice " } },
        { name: { startsWith: "Chicken Thighs " } },
      ],
    },
  });

  await prisma.category.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "test-artifact-category-" } },
        { slug: { startsWith: "updated-test-artifact-category-" } },
        { slug: { startsWith: "test-category-" } },
        { slug: { startsWith: "updated-test-category-" } },
      ],
    },
  });

  await prisma.storeTagOption.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "test-artifact-store-" } },
        { slug: { startsWith: "updated-test-artifact-store-" } },
        { slug: { startsWith: "test-store-" } },
        { slug: { startsWith: "updated-test-store-" } },
      ],
    },
  });
}

beforeAll(async () => {
  ({ prisma } = await import("../config/prisma.js"));
  await cleanupTestArtifacts();
});

afterAll(async () => {
  await cleanupTestArtifacts();
  await prisma.$disconnect();
});
