-- CreateTable
CREATE TABLE "StoreTagOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreTagOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreTagOption_slug_key" ON "StoreTagOption"("slug");

-- AddColumn
ALTER TABLE "Ingredient" ADD COLUMN "storeTagId" TEXT;

-- Seed canonical store tags for the new relational model.
INSERT INTO "StoreTagOption" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
  ('storetag_costco', 'Costco', 'costco', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('storetag_cub', 'Cub', 'cub', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('storetag_other', 'Other', 'other', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Backfill Ingredient.storeTagId from the previous enum column.
UPDATE "Ingredient"
SET "storeTagId" = 'storetag_costco'
WHERE "storeTag" = 'COSTCO';

UPDATE "Ingredient"
SET "storeTagId" = 'storetag_cub'
WHERE "storeTag" = 'CUB';

UPDATE "Ingredient"
SET "storeTagId" = 'storetag_other'
WHERE "storeTag" = 'OTHER';

-- AddForeignKey
ALTER TABLE "Ingredient"
ADD CONSTRAINT "Ingredient_storeTagId_fkey"
FOREIGN KEY ("storeTagId") REFERENCES "StoreTagOption"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Drop the old enum-backed column and type.
ALTER TABLE "Ingredient" DROP COLUMN "storeTag";

DROP TYPE "StoreTag";
