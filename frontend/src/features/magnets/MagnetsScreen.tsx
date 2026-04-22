import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { getCategories, getIconManifest, type ApiCategory, type IconManifest } from "../shared/api";

type MagnetLayout = {
  diameterMm: number;
  pageWidthMm: number;
  rowGapMm: number;
  labelSizeMm: number;
};

type LayoutUnit = "in" | "mm";

const defaultLayout: MagnetLayout = {
  diameterMm: 45,
  pageWidthMm: 215.9,
  rowGapMm: 8,
  labelSizeMm: 3.8,
};

const mmPerInch = 25.4;
const minimumMagnetGapMm = 5;
const pageEdgePaddingMm = 5;

function mmToDisplayUnit(valueMm: number, unit: LayoutUnit) {
  return unit === "in" ? Number((valueMm / mmPerInch).toFixed(3)) : Number(valueMm.toFixed(1));
}

function displayUnitToMm(value: number, unit: LayoutUnit) {
  return unit === "in" ? value * mmPerInch : value;
}

function formatSvgLength(valueMm: number, unit: LayoutUnit) {
  if (unit === "in") {
    return `${(valueMm / mmPerInch).toFixed(3)}in`;
  }

  return `${valueMm.toFixed(2)}mm`;
}

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

function getRowLayout(pageWidthMm: number, diameterMm: number) {
  const usableWidthMm = Math.max(diameterMm, pageWidthMm - pageEdgePaddingMm * 2);
  const columns = Math.max(1, Math.floor((usableWidthMm + minimumMagnetGapMm) / (diameterMm + minimumMagnetGapMm)));
  const safeColumns = Math.max(1, columns);
  const gapMm = safeColumns > 1 ? (usableWidthMm - safeColumns * diameterMm) / (safeColumns - 1) : 0;
  const startX = safeColumns === 1 ? Math.max(pageEdgePaddingMm, (pageWidthMm - diameterMm) / 2) : pageEdgePaddingMm;

  return {
    columns: safeColumns,
    gapMm: Math.max(0, gapMm),
    startX,
  };
}

function buildMagnetSvg(categories: ApiCategory[], manifest: IconManifest, layout: MagnetLayout, unit: LayoutUnit) {
  const diameter = layout.diameterMm;
  const rowLayout = getRowLayout(layout.pageWidthMm, diameter);
  const columns = rowLayout.columns;
  const rows = Math.max(1, Math.ceil(categories.length / columns));
  const width = layout.pageWidthMm;
  const height = rows * diameter + (rows - 1) * layout.rowGapMm + pageEdgePaddingMm * 2;
  const iconSize = diameter * 0.42;
  const iconOffset = diameter * 0.18;

  const magnets = categories
    .map((category, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = rowLayout.startX + column * (diameter + rowLayout.gapMm);
      const y = pageEdgePaddingMm + row * (diameter + layout.rowGapMm);
      const center = diameter / 2;
      const iconX = x + center - iconSize / 2;
      const iconY = y + center - iconSize / 2 - iconOffset;
      const labelY = y + diameter * 0.72;
      const iconPath = `${manifest.assetBasePath}/${category.iconId}.svg`;

      return `
  <g transform="translate(${x} ${y})">
    <circle cx="${center}" cy="${center}" r="${diameter / 2}" fill="#fff8ed" />
  </g>
  <image href="${escapeXml(iconPath)}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" />
  <text x="${x + center}" y="${labelY}" text-anchor="middle" font-family="Avenir Next, Trebuchet MS, sans-serif" font-size="${layout.labelSizeMm}" font-weight="700" fill="#1f1b18">${escapeXml(category.name)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgLength(width, unit)}" height="${formatSvgLength(height, unit)}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Meal category magnet sheet">${magnets}
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
  const [layoutUnit, setLayoutUnit] = useState<LayoutUnit>("in");
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
      ? buildMagnetSvg(selectedCategories, iconManifestQuery.data, layout, layoutUnit)
      : "";
  const unitLabel = layoutUnit === "in" ? "in" : "mm";
  const rowLayout = getRowLayout(layout.pageWidthMm, layout.diameterMm);

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

  function updateLinearLayoutField(field: keyof MagnetLayout, value: number) {
    updateLayoutField(field, displayUnitToMm(value, layoutUnit));
  }

  return (
    <div className="screen-layout magnet-screen">
      <SectionCard
        title="Magnet Export"
        subtitle="Select category icons, tune the print layout, and export a reusable SVG sheet."
      >
        <div className="magnet-controls">
          <div className="unit-toggle" aria-label="Measurement unit">
            <button
              type="button"
              className={layoutUnit === "in" ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setLayoutUnit("in")}
            >
              Inches
            </button>
            <button
              type="button"
              className={layoutUnit === "mm" ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => setLayoutUnit("mm")}
            >
              Millimeters
            </button>
          </div>

          <div className="field-grid">
            <label>
              <span>Page width ({unitLabel})</span>
              <input
                type="number"
                min={layoutUnit === "in" ? "2" : "50"}
                max={layoutUnit === "in" ? "24" : "610"}
                step={layoutUnit === "in" ? "0.05" : "1"}
                value={mmToDisplayUnit(layout.pageWidthMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("pageWidthMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Diameter ({unitLabel})</span>
              <input
                type="number"
                min={layoutUnit === "in" ? "0.75" : "20"}
                max={layoutUnit === "in" ? "5" : "120"}
                step={layoutUnit === "in" ? "0.05" : "1"}
                value={mmToDisplayUnit(layout.diameterMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("diameterMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Row gap ({unitLabel})</span>
              <input
                type="number"
                min="0"
                max={layoutUnit === "in" ? "1.5" : "40"}
                step={layoutUnit === "in" ? "0.05" : "1"}
                value={mmToDisplayUnit(layout.rowGapMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("rowGapMm", event.target.valueAsNumber)}
              />
            </label>
            <label>
              <span>Label size ({unitLabel})</span>
              <input
                type="number"
                min={layoutUnit === "in" ? "0.08" : "2"}
                max={layoutUnit === "in" ? "0.4" : "10"}
                step={layoutUnit === "in" ? "0.01" : "0.1"}
                value={mmToDisplayUnit(layout.labelSizeMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("labelSizeMm", event.target.valueAsNumber)}
              />
            </label>
          </div>

          <p className="muted-text">
            Layout fits {rowLayout.columns} magnet{rowLayout.columns === 1 ? "" : "s"} per row with{" "}
            {mmToDisplayUnit(rowLayout.gapMm, layoutUnit)} {unitLabel} horizontal gap. Minimum gap is{" "}
            {mmToDisplayUnit(minimumMagnetGapMm, layoutUnit)} {unitLabel}, with{" "}
            {mmToDisplayUnit(pageEdgePaddingMm, layoutUnit)} {unitLabel} page-edge padding.
          </p>

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
