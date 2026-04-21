import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { getCategories, getIconManifest, type ApiCategory, type IconManifest } from "../shared/api";

type MagnetLayout = {
  diameterMm: number;
  columns: number;
  columnGapMm: number;
  rowGapMm: number;
  labelSizeMm: number;
};

const defaultLayout: MagnetLayout = {
  diameterMm: 45,
  columns: 4,
  columnGapMm: 6,
  rowGapMm: 8,
  labelSizeMm: 3.8,
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSelectedCategories(categories: ApiCategory[], selectedCategoryIds: Set<string>) {
  return categories.filter((category) => selectedCategoryIds.has(category.id) && category.iconId);
}

function buildMagnetSvg(categories: ApiCategory[], manifest: IconManifest, layout: MagnetLayout) {
  const diameter = layout.diameterMm;
  const columns = Math.max(1, layout.columns);
  const rows = Math.max(1, Math.ceil(categories.length / columns));
  const width = columns * diameter + (columns - 1) * layout.columnGapMm;
  const height = rows * diameter + (rows - 1) * layout.rowGapMm;
  const iconSize = diameter * 0.42;
  const iconOffset = diameter * 0.18;

  const magnets = categories
    .map((category, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = column * (diameter + layout.columnGapMm);
      const y = row * (diameter + layout.rowGapMm);
      const center = diameter / 2;
      const iconX = x + center - iconSize / 2;
      const iconY = y + center - iconSize / 2 - iconOffset;
      const labelY = y + diameter * 0.72;
      const iconPath = `${manifest.assetBasePath}/${category.iconId}.svg`;

      return `
  <g transform="translate(${x} ${y})">
    <circle cx="${center}" cy="${center}" r="${diameter / 2}" fill="#fff8ed" stroke="#6f655d" stroke-width="0.35" />
  </g>
  <image href="${escapeXml(iconPath)}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" />
  <text x="${x + center}" y="${labelY}" text-anchor="middle" font-family="Avenir Next, Trebuchet MS, sans-serif" font-size="${layout.labelSizeMm}" font-weight="700" fill="#1f1b18">${escapeXml(category.name)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" role="img" aria-label="Meal category magnet sheet">${magnets}
</svg>`;
}

function downloadSvg(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "meal-category-magnets.svg";
  link.click();
  URL.revokeObjectURL(url);
}

export function MagnetsScreen() {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [layout, setLayout] = useState<MagnetLayout>(defaultLayout);
  const categoriesQuery = useQuery({
    queryKey: ["categories", "magnets"],
    queryFn: getCategories,
  });
  const iconManifestQuery = useQuery({
    queryKey: ["icon-manifest"],
    queryFn: getIconManifest,
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const iconReadyCategories = categories.filter((category) => category.iconId);
  const selectedCategories = getSelectedCategories(categories, selectedCategoryIds);
  const svg =
    iconManifestQuery.data && selectedCategories.length > 0
      ? buildMagnetSvg(selectedCategories, iconManifestQuery.data, layout)
      : "";

  useEffect(() => {
    if (!hasInitializedSelection && iconReadyCategories.length > 0) {
      setSelectedCategoryIds(new Set(iconReadyCategories.map((category) => category.id)));
      setHasInitializedSelection(true);
    }
  }, [hasInitializedSelection, iconReadyCategories]);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  function updateLayoutField(field: keyof MagnetLayout, value: number) {
    setLayout((current) => ({
      ...current,
      [field]: Number.isFinite(value) ? value : current[field],
    }));
  }

  return (
    <div className="screen-layout magnet-screen">
      <SectionCard
        title="Magnet Export"
        subtitle="Select category icons, tune the print layout, and export a reusable SVG sheet."
      >
        <div className="magnet-controls">
          <div className="field-grid">
            <label>
              <span>Diameter (mm)</span>
              <input
                type="number"
                min="20"
                max="120"
                value={layout.diameterMm}
                onChange={(event) => updateLayoutField("diameterMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Columns</span>
              <input
                type="number"
                min="1"
                max="8"
                value={layout.columns}
                onChange={(event) => updateLayoutField("columns", Math.max(1, Math.round(event.target.valueAsNumber)))}
              />
            </label>
            <label>
              <span>Column gap (mm)</span>
              <input
                type="number"
                min="0"
                max="40"
                value={layout.columnGapMm}
                onChange={(event) => updateLayoutField("columnGapMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Row gap (mm)</span>
              <input
                type="number"
                min="0"
                max="40"
                value={layout.rowGapMm}
                onChange={(event) => updateLayoutField("rowGapMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Label size (mm)</span>
              <input
                type="number"
                min="2"
                max="10"
                step="0.1"
                value={layout.labelSizeMm}
                onChange={(event) => updateLayoutField("labelSizeMm", event.target.valueAsNumber)}
              />
            </label>
          </div>

          <div className="toggle-row">
            <button
              type="button"
              className="filter-chip"
              onClick={() => setSelectedCategoryIds(new Set(iconReadyCategories.map((category) => category.id)))}
            >
              Select all
            </button>
            <button type="button" className="filter-chip" onClick={() => setSelectedCategoryIds(new Set())}>
              Clear
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!svg}
              onClick={() => {
                if (svg) downloadSvg(svg);
              }}
            >
              Download SVG
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Categories" subtitle="Only categories with assigned icon IDs can be included.">
        {categoriesQuery.isLoading ? <p>Loading categories...</p> : null}
        {!categoriesQuery.isLoading && iconReadyCategories.length === 0 ? (
          <EmptyState title="No category icons yet" message="Assign icons in Settings before exporting magnets." />
        ) : null}
        <div className="magnet-category-grid">
          {iconReadyCategories.map((category) => (
            <label key={category.id} className="magnet-category-option">
              <input
                type="checkbox"
                checked={selectedCategoryIds.has(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Preview"
        subtitle={`${selectedCategories.length} magnet${selectedCategories.length === 1 ? "" : "s"} selected`}
      >
        {iconManifestQuery.isLoading ? <p>Loading icon manifest...</p> : null}
        {iconManifestQuery.isError ? <p className="muted-text">Icon manifest could not be loaded.</p> : null}
        {!svg ? <EmptyState title="Nothing to preview" message="Select at least one category with an icon." /> : null}
        {svg ? <div className="magnet-preview" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      </SectionCard>
    </div>
  );
}
