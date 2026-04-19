import { prisma } from "../config/prisma.js";
import type { StoreTagRecord } from "../domain/models.js";

type UpsertStoreTagInput = {
  name: string;
  slug: string;
};

function mapStoreTag(storeTag: { id: string; name: string; slug: string }): StoreTagRecord {
  return {
    id: storeTag.id,
    name: storeTag.name,
    slug: storeTag.slug,
  };
}

export async function listStoreTags() {
  const storeTags = await prisma.storeTagOption.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return storeTags.map(mapStoreTag);
}

export async function getStoreTagById(storeTagId: string) {
  const storeTag = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
  });

  return storeTag ? mapStoreTag(storeTag) : null;
}

export async function createStoreTag(input: UpsertStoreTagInput) {
  const storeTag = await prisma.storeTagOption.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
  });

  return mapStoreTag(storeTag);
}

export async function updateStoreTag(storeTagId: string, input: UpsertStoreTagInput) {
  const existing = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
  });

  if (!existing) {
    return null;
  }

  const storeTag = await prisma.storeTagOption.update({
    where: { id: storeTagId },
    data: {
      name: input.name,
      slug: input.slug,
    },
  });

  return mapStoreTag(storeTag);
}

export async function deleteStoreTag(storeTagId: string) {
  const existing = await prisma.storeTagOption.findUnique({
    where: { id: storeTagId },
    include: {
      ingredients: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!existing) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (existing.ingredients.length > 0) {
    return { deleted: false, reason: "in_use" as const };
  }

  await prisma.storeTagOption.delete({
    where: { id: storeTagId },
  });

  return { deleted: true as const };
}
