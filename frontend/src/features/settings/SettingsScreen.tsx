import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "../../components/SectionCard";
import { getCategories, getIconManifest, getStoreTags, updateCategory } from "../shared/api";

export function SettingsScreen() {
  const queryClient = useQueryClient();
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

  const iconManifest = iconManifestQuery.data;
  const iconById = new Map(iconManifest?.icons.map((icon) => [icon.id, icon]) ?? []);

  return (
    <div className="screen-layout">
      <SectionCard title="Reference Data" subtitle="A lightweight admin-style view for category and store-tag vocab.">
        <div className="reference-grid">
          <div className="mini-panel">
            <h3>Categories</h3>
            <ul className="category-icon-list">
              {categoriesQuery.data?.categories.map((category) => (
                <li key={category.id} className="category-icon-row">
                  <div className="category-icon-preview" aria-hidden="true">
                    {category.iconId && iconManifest ? (
                      <img src={`${iconManifest.assetBasePath}/${category.iconId}.svg`} alt="" />
                    ) : (
                      <span>No icon</span>
                    )}
                  </div>
                  <div className="category-icon-copy">
                    <strong>{category.name}</strong>
                    <span className="muted-text">/{category.slug}</span>
                  </div>
                  <label>
                    <span>Icon</span>
                    <select
                      value={category.iconId ?? ""}
                      disabled={!iconManifest || updateCategoryMutation.isPending}
                      onChange={(event) =>
                        updateCategoryMutation.mutate({
                          categoryId: category.id,
                          name: category.name,
                          slug: category.slug,
                          iconId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">No icon</option>
                      {iconManifest?.icons.map((icon) => (
                        <option key={icon.id} value={icon.id}>
                          #{icon.id} {icon.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {category.iconId && !iconById.has(category.iconId) ? (
                    <p className="muted-text">Current icon ID is not in the manifest.</p>
                  ) : null}
                </li>
              ))}
            </ul>
            {updateCategoryMutation.isError ? (
              <p className="muted-text">Category icon could not be saved. Please try again.</p>
            ) : null}
          </div>
          <div className="mini-panel">
            <h3>Store Tags</h3>
            <ul className="plain-list">
              {storeTagsQuery.data?.storeTags.map((storeTag) => (
                <li key={storeTag.id}>
                  <strong>{storeTag.name}</strong> <span className="muted-text">/{storeTag.slug}</span>
                </li>
              ))}
            </ul>
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
