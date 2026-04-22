import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "../../components/SectionCard";
import {
  createCategory,
  createStoreTag,
  deleteCategory,
  deleteStoreTag,
  getCategories,
  getIconManifest,
  getStoreTags,
  updateCategory,
  updateStoreTag,
  type ApiCategory,
  type ApiStoreTag,
} from "../shared/api";

type CategoryDraft = {
  name: string;
  slug: string;
  iconId: string;
};

const emptyCategoryDraft: CategoryDraft = {
  name: "",
  slug: "",
  iconId: "",
};

type StoreTagDraft = {
  name: string;
  slug: string;
};

const emptyStoreTagDraft: StoreTagDraft = {
  name: "",
  slug: "",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryDraft(category: ApiCategory, drafts: Record<string, CategoryDraft>) {
  return (
    drafts[category.id] ?? {
      name: category.name,
      slug: category.slug,
      iconId: category.iconId ?? "",
    }
  );
}

function getStoreTagDraft(storeTag: ApiStoreTag, drafts: Record<string, StoreTagDraft>) {
  return (
    drafts[storeTag.id] ?? {
      name: storeTag.name,
      slug: storeTag.slug,
    }
  );
}

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState<CategoryDraft>(emptyCategoryDraft);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newStoreTag, setNewStoreTag] = useState<StoreTagDraft>(emptyStoreTagDraft);
  const [storeTagDrafts, setStoreTagDrafts] = useState<Record<string, StoreTagDraft>>({});
  const categoriesQuery = useQuery({
    queryKey: ["categories", "settings"],
    queryFn: getCategories,
  });
  const storeTagsQuery = useQuery({
    queryKey: ["store-tags", "settings"],
    queryFn: getStoreTags,
  });
  const iconManifestQuery = useQuery({
    queryKey: ["icon-manifest"],
    queryFn: getIconManifest,
  });
  const updateCategoryMutation = useMutation({
    mutationFn: (payload: { categoryId: string; name: string; slug: string; iconId?: string | null }) =>
      updateCategory(payload.categoryId, {
        name: payload.name,
        slug: payload.slug,
        iconId: payload.iconId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string; iconId?: string | null }) => createCategory(payload),
    onSuccess: () => {
      setNewCategory(emptyCategoryDraft);
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
  const createStoreTagMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) => createStoreTag(payload),
    onSuccess: () => {
      setNewStoreTag(emptyStoreTagDraft);
      void queryClient.invalidateQueries({ queryKey: ["store-tags"] });
    },
  });
  const updateStoreTagMutation = useMutation({
    mutationFn: (payload: { storeTagId: string; name: string; slug: string }) =>
      updateStoreTag(payload.storeTagId, {
        name: payload.name,
        slug: payload.slug,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-tags"] });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
  const deleteStoreTagMutation = useMutation({
    mutationFn: deleteStoreTag,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-tags"] });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });

  const iconManifest = iconManifestQuery.data;
  const iconById = new Map(iconManifest?.icons.map((icon) => [icon.id, icon]) ?? []);
  const isCategoryMutationPending =
    updateCategoryMutation.isPending || createCategoryMutation.isPending || deleteCategoryMutation.isPending;
  const isStoreTagMutationPending =
    createStoreTagMutation.isPending || updateStoreTagMutation.isPending || deleteStoreTagMutation.isPending;

  function updateCategoryDraft(category: ApiCategory, patch: Partial<CategoryDraft>) {
    setCategoryDrafts((current) => ({
      ...current,
      [category.id]: {
        ...getCategoryDraft(category, current),
        ...patch,
      },
    }));
  }

  function updateStoreTagDraft(storeTag: ApiStoreTag, patch: Partial<StoreTagDraft>) {
    setStoreTagDrafts((current) => ({
      ...current,
      [storeTag.id]: {
        ...getStoreTagDraft(storeTag, current),
        ...patch,
      },
    }));
  }

  function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      return;
    }

    createCategoryMutation.mutate({
      name: newCategory.name.trim(),
      slug: newCategory.slug.trim(),
      iconId: newCategory.iconId || null,
    });
  }

  function handleCreateStoreTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newStoreTag.name.trim() || !newStoreTag.slug.trim()) {
      return;
    }

    createStoreTagMutation.mutate({
      name: newStoreTag.name.trim(),
      slug: newStoreTag.slug.trim(),
    });
  }

  function handleSaveCategory(category: ApiCategory) {
    const draft = getCategoryDraft(category, categoryDrafts);

    if (!draft.name.trim() || !draft.slug.trim()) {
      return;
    }

    updateCategoryMutation.mutate(
      {
        categoryId: category.id,
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        iconId: draft.iconId || null,
      },
      {
        onSuccess: () => {
          setCategoryDrafts((current) => {
            const next = { ...current };
            delete next[category.id];
            return next;
          });
        },
      },
    );
  }

  function handleSaveStoreTag(storeTag: ApiStoreTag) {
    const draft = getStoreTagDraft(storeTag, storeTagDrafts);

    if (!draft.name.trim() || !draft.slug.trim()) {
      return;
    }

    updateStoreTagMutation.mutate(
      {
        storeTagId: storeTag.id,
        name: draft.name.trim(),
        slug: draft.slug.trim(),
      },
      {
        onSuccess: () => {
          setStoreTagDrafts((current) => {
            const next = { ...current };
            delete next[storeTag.id];
            return next;
          });
        },
      },
    );
  }

  return (
    <div className="screen-layout">
      <SectionCard title="Reference Data" subtitle="A lightweight admin-style view for category and store-tag vocab.">
        <div className="reference-grid">
          <div className="mini-panel">
            <h3>Categories</h3>
            <form className="category-editor-form category-create-form" onSubmit={handleCreateCategory}>
              <label>
                <span>Name</span>
                <input
                  value={newCategory.name}
                  placeholder="Pizza night"
                  onChange={(event) => {
                    const name = event.target.value;
                    setNewCategory((current) => ({
                      ...current,
                      name,
                      slug: slugify(name),
                    }));
                  }}
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={newCategory.slug}
                  placeholder="pizza-night"
                  onChange={(event) => setNewCategory((current) => ({ ...current, slug: slugify(event.target.value) }))}
                />
              </label>
              <label>
                <span>Icon</span>
                <select
                  value={newCategory.iconId}
                  disabled={!iconManifest}
                  onChange={(event) => setNewCategory((current) => ({ ...current, iconId: event.target.value }))}
                >
                  <option value="">No icon</option>
                  {iconManifest?.icons.map((icon) => (
                    <option key={icon.id} value={icon.id}>
                      #{icon.id} {icon.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="primary-button" disabled={isCategoryMutationPending}>
                Add category
              </button>
            </form>
            <ul className="category-icon-list">
              {categoriesQuery.data?.categories.map((category) => {
                const draft = getCategoryDraft(category, categoryDrafts);
                const isDirty =
                  draft.name !== category.name || draft.slug !== category.slug || draft.iconId !== (category.iconId ?? "");

                return (
                  <li key={category.id} className="category-icon-row">
                    <div className="category-icon-preview" aria-hidden="true">
                      {draft.iconId && iconManifest ? (
                        <img src={`${iconManifest.assetBasePath}/${draft.iconId}.svg`} alt="" />
                      ) : (
                        <span>No icon</span>
                      )}
                    </div>
                    <div className="category-icon-copy">
                      <strong>{category.name}</strong>
                      <span className="muted-text">/{category.slug}</span>
                    </div>
                    <div className="category-editor-form">
                      <label>
                        <span>Name</span>
                        <input
                          value={draft.name}
                          onChange={(event) => updateCategoryDraft(category, { name: event.target.value })}
                        />
                      </label>
                      <label>
                        <span>Slug</span>
                        <input
                          value={draft.slug}
                          onChange={(event) => updateCategoryDraft(category, { slug: slugify(event.target.value) })}
                        />
                      </label>
                      <label>
                        <span>Icon</span>
                        <select
                          value={draft.iconId}
                          disabled={!iconManifest || isCategoryMutationPending}
                          onChange={(event) => updateCategoryDraft(category, { iconId: event.target.value })}
                        >
                          <option value="">No icon</option>
                          {iconManifest?.icons.map((icon) => (
                            <option key={icon.id} value={icon.id}>
                              #{icon.id} {icon.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="category-editor-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={!isDirty || isCategoryMutationPending}
                          onClick={() => handleSaveCategory(category)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="secondary-button danger-button"
                          disabled={isCategoryMutationPending}
                          onClick={() => {
                            if (window.confirm(`Delete "${category.name}"? Categories used by meals cannot be deleted.`)) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {draft.iconId && !iconById.has(draft.iconId) ? (
                      <p className="muted-text">Current icon ID is not in the manifest.</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {updateCategoryMutation.isError ? (
              <p className="muted-text">Category could not be saved. Please check for duplicate slugs.</p>
            ) : null}
            {createCategoryMutation.isError ? (
              <p className="muted-text">Category could not be created. Please check for duplicate slugs.</p>
            ) : null}
            {deleteCategoryMutation.isError ? (
              <p className="muted-text">
                {deleteCategoryMutation.error instanceof Error
                  ? deleteCategoryMutation.error.message
                  : "Category could not be deleted."}
              </p>
            ) : null}
          </div>
          <div className="mini-panel">
            <h3>Store Tags</h3>
            <form className="category-editor-form category-create-form" onSubmit={handleCreateStoreTag}>
              <label>
                <span>Name</span>
                <input
                  value={newStoreTag.name}
                  placeholder="Aldi"
                  onChange={(event) => {
                    const name = event.target.value;
                    setNewStoreTag((current) => ({
                      ...current,
                      name,
                      slug: slugify(name),
                    }));
                  }}
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={newStoreTag.slug}
                  placeholder="aldi"
                  onChange={(event) => setNewStoreTag((current) => ({ ...current, slug: slugify(event.target.value) }))}
                />
              </label>
              <button type="submit" className="primary-button" disabled={isStoreTagMutationPending}>
                Add store tag
              </button>
            </form>
            <ul className="settings-record-list">
              {storeTagsQuery.data?.storeTags.map((storeTag) => (
                <li key={storeTag.id} className="settings-record-row">
                  <div>
                    <strong>{storeTag.name}</strong> <span className="muted-text">/{storeTag.slug}</span>
                  </div>
                  <div className="category-editor-form">
                    <label>
                      <span>Name</span>
                      <input
                        value={getStoreTagDraft(storeTag, storeTagDrafts).name}
                        onChange={(event) => updateStoreTagDraft(storeTag, { name: event.target.value })}
                      />
                    </label>
                    <label>
                      <span>Slug</span>
                      <input
                        value={getStoreTagDraft(storeTag, storeTagDrafts).slug}
                        onChange={(event) => updateStoreTagDraft(storeTag, { slug: slugify(event.target.value) })}
                      />
                    </label>
                    <div className="category-editor-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={
                          isStoreTagMutationPending ||
                          (getStoreTagDraft(storeTag, storeTagDrafts).name === storeTag.name &&
                            getStoreTagDraft(storeTag, storeTagDrafts).slug === storeTag.slug)
                        }
                        onClick={() => handleSaveStoreTag(storeTag)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="secondary-button danger-button"
                        disabled={isStoreTagMutationPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${storeTag.name}"? Store tags used by ingredients cannot be deleted.`,
                            )
                          ) {
                            deleteStoreTagMutation.mutate(storeTag.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {createStoreTagMutation.isError ? (
              <p className="muted-text">Store tag could not be created. Please check for duplicate slugs.</p>
            ) : null}
            {updateStoreTagMutation.isError ? (
              <p className="muted-text">Store tag could not be saved. Please check for duplicate slugs.</p>
            ) : null}
            {deleteStoreTagMutation.isError ? (
              <p className="muted-text">
                {deleteStoreTagMutation.error instanceof Error
                  ? deleteStoreTagMutation.error.message
                  : "Store tag could not be deleted."}
              </p>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Icon Library"
        subtitle="Loaded from the frontend-served icon manifest. These IDs are what categories should reference."
      >
        {iconManifestQuery.isLoading ? <p>Loading icon manifest...</p> : null}
        {iconManifestQuery.isError ? <p className="muted-text">Icon manifest could not be loaded.</p> : null}
        <div className="icon-library-grid">
          {iconManifestQuery.data?.icons.map((icon) => (
            <article key={icon.id} className={`icon-library-card icon-confidence-${icon.confidence}`}>
              <div className="icon-library-meta">
                <strong>#{icon.id}</strong>
                <span>{icon.confidence}</span>
              </div>
              <img src={`${iconManifestQuery.data.assetBasePath}/${icon.id}.svg`} alt="" />
              <p>{icon.name}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
