import { type FormEvent, useMemo, useState } from "react";
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
  type IconManifest,
  type IconManifestEntry,
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

function getMutationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getIconSearchText(icon: IconManifestEntry) {
  return `${icon.name} ${icon.slug} ${icon.aiGenerated ? "ai" : ""} ${icon.confidence}`.toLowerCase();
}

type IconPickerProps = {
  value: string;
  manifest?: IconManifest;
  disabled?: boolean;
  onChange: (iconId: string) => void;
};

function IconPicker({ value, manifest, disabled = false, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedIcon = manifest?.icons.find((icon) => icon.id === value);
  const filteredIcons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!manifest) {
      return [];
    }

    if (!normalizedQuery) {
      return manifest.icons;
    }

    return manifest.icons.filter((icon) => getIconSearchText(icon).includes(normalizedQuery));
  }, [manifest, query]);

  function selectIcon(iconId: string) {
    onChange(iconId);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="icon-combobox">
      <button
        type="button"
        className="icon-combobox-trigger"
        disabled={!manifest || disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="icon-combobox-preview" aria-hidden="true">
          {selectedIcon && manifest ? <img src={`${manifest.assetBasePath}/${selectedIcon.id}.svg`} alt="" /> : null}
        </span>
        <span>{selectedIcon?.name ?? "No icon"}</span>
      </button>

      {isOpen && manifest ? (
        <div className="icon-combobox-popover">
          <input
            className="icon-combobox-search"
            value={query}
            placeholder="Search icons"
            aria-label="Search icons"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          <div className="icon-combobox-list" role="listbox">
            <button
              type="button"
              className={!value ? "icon-combobox-option icon-combobox-option-active" : "icon-combobox-option"}
              role="option"
              aria-selected={!value}
              onClick={() => selectIcon("")}
            >
              <span className="icon-combobox-preview" aria-hidden="true" />
              <span>No icon</span>
            </button>
            {filteredIcons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className={icon.id === value ? "icon-combobox-option icon-combobox-option-active" : "icon-combobox-option"}
                role="option"
                aria-selected={icon.id === value}
                onClick={() => selectIcon(icon.id)}
              >
                <span className="icon-combobox-preview" aria-hidden="true">
                  <img src={`${manifest.assetBasePath}/${icon.id}.svg`} alt="" />
                </span>
                <span>{icon.name}</span>
                {icon.aiGenerated ? <span className="icon-combobox-badge">AI</span> : null}
              </button>
            ))}
            {filteredIcons.length === 0 ? <p className="muted-text">No matching icons.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
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
  const categoryErrorMessage = deleteCategoryMutation.isError
    ? getMutationErrorMessage(deleteCategoryMutation.error, "Category could not be deleted.")
    : updateCategoryMutation.isError
      ? "Category could not be saved. Please check for duplicate slugs."
      : createCategoryMutation.isError
        ? "Category could not be created. Please check for duplicate slugs."
        : "";
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
            {categoryErrorMessage ? (
              <div className="status-message status-error" role="status">
                <p>{categoryErrorMessage}</p>
              </div>
            ) : null}
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
                <IconPicker
                  value={newCategory.iconId}
                  manifest={iconManifest}
                  disabled={!iconManifest}
                  onChange={(iconId) => setNewCategory((current) => ({ ...current, iconId }))}
                />
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
                        <IconPicker
                          value={draft.iconId}
                          manifest={iconManifest}
                          disabled={!iconManifest || isCategoryMutationPending}
                          onChange={(iconId) => updateCategoryDraft(category, { iconId })}
                        />
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
                <span>{icon.aiGenerated ? `AI ${icon.confidence}` : icon.confidence}</span>
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
