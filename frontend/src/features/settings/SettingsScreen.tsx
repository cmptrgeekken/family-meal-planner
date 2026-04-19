import { useQuery } from "@tanstack/react-query";

import { SectionCard } from "../../components/SectionCard";
import { getCategories, getStoreTags } from "../shared/api";

export function SettingsScreen() {
  const categoriesQuery = useQuery({
    queryKey: ["categories", "settings"],
    queryFn: getCategories,
  });
  const storeTagsQuery = useQuery({
    queryKey: ["store-tags", "settings"],
    queryFn: getStoreTags,
  });

  return (
    <div className="screen-layout">
      <SectionCard title="Reference Data" subtitle="A lightweight admin-style view for category and store-tag vocab.">
        <div className="reference-grid">
          <div className="mini-panel">
            <h3>Categories</h3>
            <ul className="plain-list">
              {categoriesQuery.data?.categories.map((category) => (
                <li key={category.id}>
                  <strong>{category.name}</strong> <span className="muted-text">/{category.slug}</span>
                </li>
              ))}
            </ul>
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
    </div>
  );
}
