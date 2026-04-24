import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Modal } from "../../components/Modal";
import { SectionCard } from "../../components/SectionCard";
import {
  createCategory,
  createPlanSlot,
  createStoreTag,
  deleteCategory,
  deletePlanSlot,
  deleteStoreTag,
  getCategories,
  getIconManifest,
  getPlanSlots,
  getStoreTags,
  reorderPlanSlots,
  updateCategory,
  updatePlanSlot,
  updateStoreTag,
  type ApiCategory,
  type ApiPlanSlot,
  type IconManifest,
  type IconManifestEntry,
  type ApiStoreTag,
} from "../shared/api";

type CategoryDraft = {
  name: string;
  slug: string;
  iconId: string;
  slotSlugs: string[];
  weeklyMinCount: string;
  weeklyMaxCount: string;
};

const emptyCategoryDraft: CategoryDraft = {
  name: "",
  slug: "",
  iconId: "",
  slotSlugs: [],
  weeklyMinCount: "",
  weeklyMaxCount: "",
};

type PlanSlotDraft = {
  name: string;
  slug: string;
  isEnabled: boolean;
};

const emptyPlanSlotDraft: PlanSlotDraft = {
  name: "",
  slug: "",
  isEnabled: true,
};

type StoreTagDraft = {
  name: string;
  slug: string;
};

type SettingsSection = "plan-slots" | "categories" | "store-tags" | "icon-library";

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
      slotSlugs: category.slotSlugs,
      weeklyMinCount: category.weeklyMinCount?.toString() ?? "",
      weeklyMaxCount: category.weeklyMaxCount?.toString() ?? "",
    }
  );
}

function getPlanSlotDraft(planSlot: ApiPlanSlot, drafts: Record<string, PlanSlotDraft>) {
  return (
    drafts[planSlot.id] ?? {
      name: planSlot.name,
      slug: planSlot.slug,
      isEnabled: planSlot.isEnabled,
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

function getDefaultCategorySlotSlugs(planSlots: ApiPlanSlot[]) {
  const dinnerSlot = planSlots.find((slot) => slot.slug === "dinner");
  const firstEnabledSlot = planSlots.find((slot) => slot.isEnabled);
  const defaultSlot = dinnerSlot ?? firstEnabledSlot ?? planSlots[0];

  return defaultSlot ? [defaultSlot.slug] : [];
}

function getEmptyCategoryDraft(planSlots: ApiPlanSlot[]): CategoryDraft {
  return {
    ...emptyCategoryDraft,
    slotSlugs: getDefaultCategorySlotSlugs(planSlots),
  };
}

function parseOptionalCount(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((value, index) => value === sortedRight[index]);
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
  const [activeSection, setActiveSection] = useState<SettingsSection>("categories");
  const [newCategory, setNewCategory] = useState<CategoryDraft>(emptyCategoryDraft);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newPlanSlot, setNewPlanSlot] = useState<PlanSlotDraft>(emptyPlanSlotDraft);
  const [planSlotDrafts, setPlanSlotDrafts] = useState<Record<string, PlanSlotDraft>>({});
  const [newStoreTag, setNewStoreTag] = useState<StoreTagDraft>(emptyStoreTagDraft);
  const [storeTagDrafts, setStoreTagDrafts] = useState<Record<string, StoreTagDraft>>({});
  const [categoryEditorId, setCategoryEditorId] = useState<string | null>(null);
  const [planSlotEditorId, setPlanSlotEditorId] = useState<string | null>(null);
  const [storeTagEditorId, setStoreTagEditorId] = useState<string | null>(null);
  const [isCategoryCreateOpen, setIsCategoryCreateOpen] = useState(false);
  const [isPlanSlotCreateOpen, setIsPlanSlotCreateOpen] = useState(false);
  const [isStoreTagCreateOpen, setIsStoreTagCreateOpen] = useState(false);
  const planSlotsQuery = useQuery({
    queryKey: ["plan-slots"],
    queryFn: getPlanSlots,
  });
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
    mutationFn: (payload: { categoryId: string; draft: CategoryDraft }) =>
      updateCategory(payload.categoryId, {
        name: payload.draft.name,
        slug: payload.draft.slug,
        iconId: payload.draft.iconId || null,
        slotSlugs: payload.draft.slotSlugs,
        weeklyMinCount: parseOptionalCount(payload.draft.weeklyMinCount),
        weeklyMaxCount: parseOptionalCount(payload.draft.weeklyMaxCount),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["meals"] });
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan"] });
    },
  });
  const createCategoryMutation = useMutation({
    mutationFn: (draft: CategoryDraft) =>
      createCategory({
        name: draft.name,
        slug: draft.slug,
        iconId: draft.iconId || null,
        slotSlugs: draft.slotSlugs,
        weeklyMinCount: parseOptionalCount(draft.weeklyMinCount),
        weeklyMaxCount: parseOptionalCount(draft.weeklyMaxCount),
      }),
    onSuccess: () => {
      setNewCategory(getEmptyCategoryDraft(planSlotsQuery.data?.planSlots ?? []));
      setIsCategoryCreateOpen(false);
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
  const createPlanSlotMutation = useMutation({
    mutationFn: (payload: PlanSlotDraft) =>
      createPlanSlot({
        name: payload.name,
        slug: payload.slug,
        isEnabled: payload.isEnabled,
      }),
    onSuccess: () => {
      setNewPlanSlot(emptyPlanSlotDraft);
      setIsPlanSlotCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
    },
  });
  const updatePlanSlotMutation = useMutation({
    mutationFn: (payload: { planSlotId: string; draft: PlanSlotDraft; sortOrder: number }) =>
      updatePlanSlot(payload.planSlotId, {
        name: payload.draft.name,
        slug: payload.draft.slug,
        isEnabled: payload.draft.isEnabled,
        sortOrder: payload.sortOrder,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["weekly-plan"] });
    },
  });
  const reorderPlanSlotsMutation = useMutation({
    mutationFn: reorderPlanSlots,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
    },
  });
  const deletePlanSlotMutation = useMutation({
    mutationFn: deletePlanSlot,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const createStoreTagMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) => createStoreTag(payload),
    onSuccess: () => {
      setNewStoreTag(emptyStoreTagDraft);
      setIsStoreTagCreateOpen(false);
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
  const planSlots = planSlotsQuery.data?.planSlots ?? [];
  const categories = categoriesQuery.data?.categories ?? [];
  const storeTags = storeTagsQuery.data?.storeTags ?? [];
  const categoryErrorMessage = deleteCategoryMutation.isError
    ? getMutationErrorMessage(deleteCategoryMutation.error, "Category could not be deleted.")
    : updateCategoryMutation.isError
      ? getMutationErrorMessage(updateCategoryMutation.error, "Category could not be saved. Please check for duplicate slugs.")
      : createCategoryMutation.isError
        ? getMutationErrorMessage(createCategoryMutation.error, "Category could not be created. Please check for duplicate slugs.")
        : "";
  const planSlotErrorMessage = deletePlanSlotMutation.isError
    ? getMutationErrorMessage(deletePlanSlotMutation.error, "Meal slot could not be deleted.")
    : updatePlanSlotMutation.isError
      ? getMutationErrorMessage(updatePlanSlotMutation.error, "Meal slot could not be saved.")
      : createPlanSlotMutation.isError
        ? getMutationErrorMessage(createPlanSlotMutation.error, "Meal slot could not be created.")
        : reorderPlanSlotsMutation.isError
          ? getMutationErrorMessage(reorderPlanSlotsMutation.error, "Meal slots could not be reordered.")
          : "";
  const storeTagErrorMessage = createStoreTagMutation.isError
    ? getMutationErrorMessage(createStoreTagMutation.error, "Store tag could not be created. Please check for duplicate slugs.")
    : updateStoreTagMutation.isError
      ? getMutationErrorMessage(updateStoreTagMutation.error, "Store tag could not be saved. Please check for duplicate slugs.")
      : deleteStoreTagMutation.isError
        ? getMutationErrorMessage(deleteStoreTagMutation.error, "Store tag could not be deleted.")
        : "";
  const isCategoryMutationPending =
    updateCategoryMutation.isPending || createCategoryMutation.isPending || deleteCategoryMutation.isPending;
  const isPlanSlotMutationPending =
    createPlanSlotMutation.isPending ||
    updatePlanSlotMutation.isPending ||
    reorderPlanSlotsMutation.isPending ||
    deletePlanSlotMutation.isPending;
  const isStoreTagMutationPending =
    createStoreTagMutation.isPending || updateStoreTagMutation.isPending || deleteStoreTagMutation.isPending;

  useEffect(() => {
    if (planSlots.length === 0) {
      return;
    }

    if (newCategory.name || newCategory.slug || newCategory.iconId || newCategory.slotSlugs.length > 0) {
      return;
    }

    setNewCategory(getEmptyCategoryDraft(planSlots));
  }, [newCategory, planSlots]);

  function updateCategoryDraft(category: ApiCategory, patch: Partial<CategoryDraft>) {
    setCategoryDrafts((current) => ({
      ...current,
      [category.id]: {
        ...getCategoryDraft(category, current),
        ...patch,
      },
    }));
  }

  function updatePlanSlotDraft(planSlot: ApiPlanSlot, patch: Partial<PlanSlotDraft>) {
    setPlanSlotDrafts((current) => ({
      ...current,
      [planSlot.id]: {
        ...getPlanSlotDraft(planSlot, current),
        ...patch,
      },
    }));
  }

  function updateCategorySlotDraft(category: ApiCategory, slotSlug: string, isChecked: boolean) {
    const draft = getCategoryDraft(category, categoryDrafts);
    const slotSlugs = isChecked
      ? [...new Set([...draft.slotSlugs, slotSlug])]
      : draft.slotSlugs.filter((currentSlug) => currentSlug !== slotSlug);

    updateCategoryDraft(category, { slotSlugs });
  }

  function movePlanSlot(planSlot: ApiPlanSlot, direction: -1 | 1) {
    const currentIndex = planSlots.findIndex((slot) => slot.id === planSlot.id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= planSlots.length) {
      return;
    }

    const reordered = [...planSlots];
    const [movedSlot] = reordered.splice(currentIndex, 1);

    if (!movedSlot) {
      return;
    }

    reordered.splice(nextIndex, 0, movedSlot);

    reorderPlanSlotsMutation.mutate(reordered.map((slot) => slot.id));
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
      iconId: newCategory.iconId,
      slotSlugs: newCategory.slotSlugs.length > 0 ? newCategory.slotSlugs : getDefaultCategorySlotSlugs(planSlots),
      weeklyMinCount: newCategory.weeklyMinCount,
      weeklyMaxCount: newCategory.weeklyMaxCount,
    });
  }

  function handleCreatePlanSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newPlanSlot.name.trim() || !newPlanSlot.slug.trim()) {
      return;
    }

    createPlanSlotMutation.mutate({
      name: newPlanSlot.name.trim(),
      slug: newPlanSlot.slug.trim(),
      isEnabled: newPlanSlot.isEnabled,
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
        draft: {
          ...draft,
          name: draft.name.trim(),
          slug: draft.slug.trim(),
        },
      },
      {
        onSuccess: () => {
          setCategoryDrafts((current) => {
            const next = { ...current };
            delete next[category.id];
            return next;
          });
          setCategoryEditorId(null);
        },
      },
    );
  }

  function handleSavePlanSlot(planSlot: ApiPlanSlot) {
    const draft = getPlanSlotDraft(planSlot, planSlotDrafts);

    if (!draft.name.trim() || !draft.slug.trim()) {
      return;
    }

    updatePlanSlotMutation.mutate(
      {
        planSlotId: planSlot.id,
        draft: {
          ...draft,
          name: draft.name.trim(),
          slug: draft.slug.trim(),
        },
        sortOrder: planSlot.sortOrder,
      },
      {
        onSuccess: () => {
          setPlanSlotDrafts((current) => {
            const next = { ...current };
            delete next[planSlot.id];
            return next;
          });
          setPlanSlotEditorId(null);
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
          setStoreTagEditorId(null);
        },
      },
    );
  }

  const editingCategory = categoryEditorId ? categories.find((category) => category.id === categoryEditorId) ?? null : null;
  const editingPlanSlot = planSlotEditorId ? planSlots.find((planSlot) => planSlot.id === planSlotEditorId) ?? null : null;
  const editingStoreTag = storeTagEditorId ? storeTags.find((storeTag) => storeTag.id === storeTagEditorId) ?? null : null;
  const editingCategoryDraft = editingCategory ? getCategoryDraft(editingCategory, categoryDrafts) : null;
  const editingPlanSlotDraft = editingPlanSlot ? getPlanSlotDraft(editingPlanSlot, planSlotDrafts) : null;
  const editingStoreTagDraft = editingStoreTag ? getStoreTagDraft(editingStoreTag, storeTagDrafts) : null;
  const settingsSections: Array<{ id: SettingsSection; label: string }> = [
    { id: "categories", label: "Categories" },
    { id: "plan-slots", label: "Meal Slots" },
    { id: "store-tags", label: "Store Tags" },
    { id: "icon-library", label: "Icon Library" },
  ];

  return (
    <div className="screen-layout settings-screen-layout">
      <SectionCard
        title="Settings"
        subtitle="Manage planning vocab in smaller sections so routine admin work does not turn into one long scroll."
        actions={
          activeSection === "categories" ? (
            <button type="button" className="primary-button" onClick={() => setIsCategoryCreateOpen(true)}>
              Add category
            </button>
          ) : activeSection === "plan-slots" ? (
            <button type="button" className="primary-button" onClick={() => setIsPlanSlotCreateOpen(true)}>
              Add meal slot
            </button>
          ) : activeSection === "store-tags" ? (
            <button type="button" className="primary-button" onClick={() => setIsStoreTagCreateOpen(true)}>
              Add store tag
            </button>
          ) : null
        }
      >
        <div className="settings-section-nav" role="tablist" aria-label="Settings sections">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              className={activeSection === section.id ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === "plan-slots" ? (
          <div className="settings-section-stack">
            {planSlotErrorMessage ? (
              <div className="status-message status-error" role="status">
                <p>{planSlotErrorMessage}</p>
              </div>
            ) : null}
            {planSlotsQuery.isLoading ? <p>Loading meal slots...</p> : null}
            <ul className="settings-record-list settings-record-list-compact">
              {planSlots.map((planSlot, index) => (
                <li key={planSlot.id} className="settings-record-row">
                  <div className="settings-record-heading">
                    <div className="settings-record-copy">
                      <strong>{planSlot.name}</strong>
                      <span className="muted-text">/{planSlot.slug}</span>
                    </div>
                    <span className={planSlot.isEnabled ? "pill-muted" : "pill-muted pill-disabled"}>
                      {planSlot.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="settings-record-meta">
                    <span className="pill-muted">Position {index + 1}</span>
                  </div>
                  <div className="category-editor-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={index === 0 || isPlanSlotMutationPending}
                      onClick={() => movePlanSlot(planSlot, -1)}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={index === planSlots.length - 1 || isPlanSlotMutationPending}
                      onClick={() => movePlanSlot(planSlot, 1)}
                    >
                      Move down
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setPlanSlotEditorId(planSlot.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      disabled={isPlanSlotMutationPending}
                      onClick={() => {
                        if (
                          window.confirm(`Delete "${planSlot.name}"? Meal slots used by plans or categories cannot be deleted.`)
                        ) {
                          deletePlanSlotMutation.mutate(planSlot.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeSection === "categories" ? (
          <div className="settings-section-stack">
            {categoryErrorMessage ? (
              <div className="status-message status-error" role="status">
                <p>{categoryErrorMessage}</p>
              </div>
            ) : null}
            <ul className="category-icon-list settings-category-grid">
              {categories.map((category) => {
                const draft = getCategoryDraft(category, categoryDrafts);

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
                    <div className="settings-record-meta">
                      {category.slotSlugs.map((slotSlug) => {
                        const slot = planSlots.find((candidate) => candidate.slug === slotSlug);
                        return (
                          <span key={`${category.id}-${slotSlug}`} className="pill-muted">
                            {slot?.name ?? slotSlug}
                          </span>
                        );
                      })}
                      {category.weeklyMinCount != null ? <span className="pill-muted">Min {category.weeklyMinCount}</span> : null}
                      {category.weeklyMaxCount != null ? <span className="pill-muted">Max {category.weeklyMaxCount}</span> : null}
                    </div>
                    <div className="category-editor-actions">
                      <button type="button" className="secondary-button" onClick={() => setCategoryEditorId(category.id)}>
                        Edit
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
                    {draft.iconId && !iconById.has(draft.iconId) ? (
                      <p className="muted-text">Current icon ID is not in the manifest.</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {activeSection === "store-tags" ? (
          <div className="settings-section-stack">
            {storeTagErrorMessage ? (
              <div className="status-message status-error" role="status">
                <p>{storeTagErrorMessage}</p>
              </div>
            ) : null}
            <ul className="settings-record-list settings-record-list-compact settings-store-tag-grid">
              {storeTags.map((storeTag) => (
                <li key={storeTag.id} className="settings-record-row">
                  <div className="settings-record-heading">
                    <div className="settings-record-copy">
                      <strong>{storeTag.name}</strong>
                      <span className="muted-text">/{storeTag.slug}</span>
                    </div>
                  </div>
                  <div className="category-editor-actions">
                    <button type="button" className="secondary-button" onClick={() => setStoreTagEditorId(storeTag.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      disabled={isStoreTagMutationPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${storeTag.name}"? Store tags used by ingredients cannot be deleted.`)) {
                          deleteStoreTagMutation.mutate(storeTag.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeSection === "icon-library" ? (
          <div className="settings-section-stack">
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
          </div>
        ) : null}
      </SectionCard>

      <Modal
        isOpen={isPlanSlotCreateOpen}
        title="Add Meal Slot"
        description="Create a planning slot without keeping the whole settings page expanded open."
        onClose={() => {
          setIsPlanSlotCreateOpen(false);
          setNewPlanSlot(emptyPlanSlotDraft);
        }}
      >
        <form className="category-editor-form" onSubmit={handleCreatePlanSlot}>
          <label>
            <span>Name</span>
            <input
              value={newPlanSlot.name}
              placeholder="Dinner"
              onChange={(event) => {
                const name = event.target.value;
                setNewPlanSlot((current) => ({ ...current, name, slug: slugify(name) }));
              }}
            />
          </label>
          <label>
            <span>Slug</span>
            <input
              value={newPlanSlot.slug}
              placeholder="dinner"
              onChange={(event) => setNewPlanSlot((current) => ({ ...current, slug: slugify(event.target.value) }))}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={newPlanSlot.isEnabled}
              onChange={(event) => setNewPlanSlot((current) => ({ ...current, isEnabled: event.target.checked }))}
            />
            <span>Enabled for planning</span>
          </label>
          {planSlotErrorMessage ? <p className="form-error-text">{planSlotErrorMessage}</p> : null}
          <div className="category-editor-actions">
            <button type="submit" className="primary-button" disabled={isPlanSlotMutationPending}>
              Add meal slot
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setIsPlanSlotCreateOpen(false);
                setNewPlanSlot(emptyPlanSlotDraft);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingPlanSlot && editingPlanSlotDraft)}
        title="Edit Meal Slot"
        description="Update the slot name, slug, and enabled state in one focused view."
        onClose={() => setPlanSlotEditorId(null)}
      >
        {editingPlanSlot && editingPlanSlotDraft ? (
          <form
            className="category-editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSavePlanSlot(editingPlanSlot);
            }}
          >
            <label>
              <span>Name</span>
              <input
                value={editingPlanSlotDraft.name}
                onChange={(event) => updatePlanSlotDraft(editingPlanSlot, { name: event.target.value })}
              />
            </label>
            <label>
              <span>Slug</span>
              <input
                value={editingPlanSlotDraft.slug}
                onChange={(event) => updatePlanSlotDraft(editingPlanSlot, { slug: slugify(event.target.value) })}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={editingPlanSlotDraft.isEnabled}
                onChange={(event) => updatePlanSlotDraft(editingPlanSlot, { isEnabled: event.target.checked })}
              />
              <span>Enabled for planning</span>
            </label>
            {planSlotErrorMessage ? <p className="form-error-text">{planSlotErrorMessage}</p> : null}
            <div className="category-editor-actions">
              <button type="submit" className="primary-button" disabled={isPlanSlotMutationPending}>
                Save meal slot
              </button>
              <button type="button" className="secondary-button" onClick={() => setPlanSlotEditorId(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={isCategoryCreateOpen}
        title="Add Category"
        description="Create a category without keeping every category form expanded on the page."
        onClose={() => {
          setIsCategoryCreateOpen(false);
          setNewCategory(getEmptyCategoryDraft(planSlots));
        }}
      >
        <form className="category-editor-form" onSubmit={handleCreateCategory}>
          <label>
            <span>Name</span>
            <input
              value={newCategory.name}
              placeholder="Pizza night"
              onChange={(event) => {
                const name = event.target.value;
                setNewCategory((current) => ({ ...current, name, slug: slugify(name) }));
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
          <fieldset className="settings-fieldset">
            <legend>Meal slots</legend>
            <div className="slot-checkbox-grid">
              {planSlots.map((planSlot) => (
                <label key={planSlot.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={newCategory.slotSlugs.includes(planSlot.slug)}
                    onChange={(event) =>
                      setNewCategory((current) => ({
                        ...current,
                        slotSlugs: event.target.checked
                          ? [...new Set([...current.slotSlugs, planSlot.slug])]
                          : current.slotSlugs.filter((slotSlug) => slotSlug !== planSlot.slug),
                      }))
                    }
                  />
                  <span>{planSlot.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="settings-inline-fields">
            <label>
              <span>Weekly min</span>
              <input
                inputMode="numeric"
                value={newCategory.weeklyMinCount}
                placeholder="Optional"
                onChange={(event) => setNewCategory((current) => ({ ...current, weeklyMinCount: event.target.value }))}
              />
            </label>
            <label>
              <span>Weekly max</span>
              <input
                inputMode="numeric"
                value={newCategory.weeklyMaxCount}
                placeholder="Optional"
                onChange={(event) => setNewCategory((current) => ({ ...current, weeklyMaxCount: event.target.value }))}
              />
            </label>
          </div>
          {categoryErrorMessage ? <p className="form-error-text">{categoryErrorMessage}</p> : null}
          <div className="category-editor-actions">
            <button type="submit" className="primary-button" disabled={isCategoryMutationPending}>
              Add category
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setIsCategoryCreateOpen(false);
                setNewCategory(getEmptyCategoryDraft(planSlots));
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingCategory && editingCategoryDraft)}
        title="Edit Category"
        description="Adjust icon, slots, and limits without expanding every category on the page."
        onClose={() => setCategoryEditorId(null)}
      >
        {editingCategory && editingCategoryDraft ? (
          <form
            className="category-editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveCategory(editingCategory);
            }}
          >
            <label>
              <span>Name</span>
              <input
                value={editingCategoryDraft.name}
                onChange={(event) => updateCategoryDraft(editingCategory, { name: event.target.value })}
              />
            </label>
            <label>
              <span>Slug</span>
              <input
                value={editingCategoryDraft.slug}
                onChange={(event) => updateCategoryDraft(editingCategory, { slug: slugify(event.target.value) })}
              />
            </label>
            <label>
              <span>Icon</span>
              <IconPicker
                value={editingCategoryDraft.iconId}
                manifest={iconManifest}
                disabled={!iconManifest || isCategoryMutationPending}
                onChange={(iconId) => updateCategoryDraft(editingCategory, { iconId })}
              />
            </label>
            <fieldset className="settings-fieldset">
              <legend>Meal slots</legend>
              <div className="slot-checkbox-grid">
                {planSlots.map((planSlot) => (
                  <label key={planSlot.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={editingCategoryDraft.slotSlugs.includes(planSlot.slug)}
                      onChange={(event) => updateCategorySlotDraft(editingCategory, planSlot.slug, event.target.checked)}
                    />
                    <span>{planSlot.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="settings-inline-fields">
              <label>
                <span>Weekly min</span>
                <input
                  inputMode="numeric"
                  value={editingCategoryDraft.weeklyMinCount}
                  placeholder="Optional"
                  onChange={(event) => updateCategoryDraft(editingCategory, { weeklyMinCount: event.target.value })}
                />
              </label>
              <label>
                <span>Weekly max</span>
                <input
                  inputMode="numeric"
                  value={editingCategoryDraft.weeklyMaxCount}
                  placeholder="Optional"
                  onChange={(event) => updateCategoryDraft(editingCategory, { weeklyMaxCount: event.target.value })}
                />
              </label>
            </div>
            {categoryErrorMessage ? <p className="form-error-text">{categoryErrorMessage}</p> : null}
            <div className="category-editor-actions">
              <button type="submit" className="primary-button" disabled={isCategoryMutationPending}>
                Save category
              </button>
              <button type="button" className="secondary-button" onClick={() => setCategoryEditorId(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={isStoreTagCreateOpen}
        title="Add Store Tag"
        description="Keep shopping references tidy without opening another long editor stack."
        onClose={() => {
          setIsStoreTagCreateOpen(false);
          setNewStoreTag(emptyStoreTagDraft);
        }}
      >
        <form className="category-editor-form" onSubmit={handleCreateStoreTag}>
          <label>
            <span>Name</span>
            <input
              value={newStoreTag.name}
              placeholder="Aldi"
              onChange={(event) => {
                const name = event.target.value;
                setNewStoreTag((current) => ({ ...current, name, slug: slugify(name) }));
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
          {storeTagErrorMessage ? <p className="form-error-text">{storeTagErrorMessage}</p> : null}
          <div className="category-editor-actions">
            <button type="submit" className="primary-button" disabled={isStoreTagMutationPending}>
              Add store tag
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setIsStoreTagCreateOpen(false);
                setNewStoreTag(emptyStoreTagDraft);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingStoreTag && editingStoreTagDraft)}
        title="Edit Store Tag"
        description="Update the shopping tag without expanding every record in the section."
        onClose={() => setStoreTagEditorId(null)}
      >
        {editingStoreTag && editingStoreTagDraft ? (
          <form
            className="category-editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveStoreTag(editingStoreTag);
            }}
          >
            <label>
              <span>Name</span>
              <input
                value={editingStoreTagDraft.name}
                onChange={(event) => updateStoreTagDraft(editingStoreTag, { name: event.target.value })}
              />
            </label>
            <label>
              <span>Slug</span>
              <input
                value={editingStoreTagDraft.slug}
                onChange={(event) => updateStoreTagDraft(editingStoreTag, { slug: slugify(event.target.value) })}
              />
            </label>
            {storeTagErrorMessage ? <p className="form-error-text">{storeTagErrorMessage}</p> : null}
            <div className="category-editor-actions">
              <button type="submit" className="primary-button" disabled={isStoreTagMutationPending}>
                Save store tag
              </button>
              <button type="button" className="secondary-button" onClick={() => setStoreTagEditorId(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
