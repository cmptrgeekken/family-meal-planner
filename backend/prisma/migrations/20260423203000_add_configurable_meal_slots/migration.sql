-- Add first-class configurable meal slots while preserving existing dinner-only data.

ALTER TABLE "Category"
ADD COLUMN "weeklyMinCount" INTEGER,
ADD COLUMN "weeklyMaxCount" INTEGER;

CREATE TABLE "PlanSlot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryPlanSlot" (
    "categoryId" TEXT NOT NULL,
    "planSlotId" TEXT NOT NULL,

    CONSTRAINT "CategoryPlanSlot_pkey" PRIMARY KEY ("categoryId","planSlotId")
);

CREATE UNIQUE INDEX "PlanSlot_slug_key" ON "PlanSlot"("slug");

INSERT INTO "PlanSlot" ("id", "name", "slug", "sortOrder", "isEnabled", "createdAt", "updatedAt")
VALUES
    ('plan_slot_breakfast', 'Breakfast', 'breakfast', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_slot_lunch', 'Lunch', 'lunch', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('plan_slot_dinner', 'Dinner', 'dinner', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "CategoryPlanSlot" ("categoryId", "planSlotId")
SELECT "id", 'plan_slot_dinner'
FROM "Category";

ALTER TABLE "WeeklyPlanMeal"
ADD COLUMN "planSlotId" TEXT;

UPDATE "WeeklyPlanMeal"
SET "planSlotId" = 'plan_slot_dinner'
WHERE "planSlotId" IS NULL;

ALTER TABLE "WeeklyPlanMeal"
ALTER COLUMN "planSlotId" SET NOT NULL;

DROP INDEX "WeeklyPlanMeal_weeklyPlanId_dayOfWeek_key";

CREATE UNIQUE INDEX "WeeklyPlanMeal_weeklyPlanId_dayOfWeek_planSlotId_key"
ON "WeeklyPlanMeal"("weeklyPlanId", "dayOfWeek", "planSlotId");

ALTER TABLE "CategoryPlanSlot"
ADD CONSTRAINT "CategoryPlanSlot_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryPlanSlot"
ADD CONSTRAINT "CategoryPlanSlot_planSlotId_fkey"
FOREIGN KEY ("planSlotId") REFERENCES "PlanSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WeeklyPlanMeal"
ADD CONSTRAINT "WeeklyPlanMeal_planSlotId_fkey"
FOREIGN KEY ("planSlotId") REFERENCES "PlanSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
