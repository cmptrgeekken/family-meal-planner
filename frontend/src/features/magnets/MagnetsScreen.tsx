import { type KeyboardEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import {
  buildMagnetSvg,
  defaultLayout,
  displayUnitToMm,
  getRowLayout,
  getSelectedCategories,
  getSheetSize,
  getSvgBody,
  getSvgViewBox,
  magnetGutterMm,
  mmPerInch,
  mmToDisplayUnit,
  pngDpi,
  tintSvgText,
  type EmbeddedIconSvg,
  type LayoutUnit,
  type MagnetLayout,
} from "./magnet-export";
import { getCategories, getIconManifest, type ApiCategory, type IconManifest } from "../shared/api";

type MagnetExportSettings = {
  layoutUnit: LayoutUnit;
  layout: MagnetLayout;
};

type NumericLayoutField = "innerDiameterMm" | "outerDiameterMm" | "pageWidthMm";
type NumericLayoutDrafts = Record<NumericLayoutField, string>;
type ColorDrafts = Pick<MagnetLayout, "backgroundColor" | "foregroundColor">;

const localStorageKey = "family-meal-planner:magnet-export-settings";
function isLayoutUnit(value: unknown): value is LayoutUnit {
  return value === "in" || value === "mm";
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getNumericLayoutDrafts(layout: MagnetLayout, unit: LayoutUnit): NumericLayoutDrafts {
  return {
    innerDiameterMm: String(mmToDisplayUnit(layout.innerDiameterMm, unit)),
    outerDiameterMm: String(mmToDisplayUnit(layout.outerDiameterMm, unit)),
    pageWidthMm: String(mmToDisplayUnit(layout.pageWidthMm, unit)),
  };
}

function getDisplayValueBounds(field: NumericLayoutField, layout: MagnetLayout, unit: LayoutUnit) {
  if (field === "pageWidthMm") {
    return unit === "in" ? { min: 2, max: 24 } : { min: 50, max: 610 };
  }

  if (field === "innerDiameterMm") {
    return unit === "in" ? { min: 0.75, max: 5 } : { min: 20, max: 120 };
  }

  return {
    min: mmToDisplayUnit(layout.innerDiameterMm, unit),
    max: unit === "in" ? 6 : 150,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadMagnetExportSettings(): MagnetExportSettings {
  if (typeof window === "undefined") {
    return { layoutUnit: "in", layout: defaultLayout };
  }

  try {
    const savedSettings = window.localStorage.getItem(localStorageKey);

    if (!savedSettings) {
      return { layoutUnit: "in", layout: defaultLayout };
    }

    const parsed = JSON.parse(savedSettings) as Partial<MagnetExportSettings>;
    const legacyLayout = parsed.layout as
      | (Partial<MagnetLayout> & { diameterMm?: number; finalDiameterMm?: number; cutoutDiameterMm?: number })
      | undefined;
    const savedInnerDiameter = toFiniteNumber(
      legacyLayout?.innerDiameterMm,
      toFiniteNumber(legacyLayout?.finalDiameterMm, toFiniteNumber(legacyLayout?.diameterMm, defaultLayout.innerDiameterMm)),
    );

    return {
      layoutUnit: isLayoutUnit(parsed.layoutUnit) ? parsed.layoutUnit : "in",
      layout: {
        innerDiameterMm: savedInnerDiameter,
        outerDiameterMm: Math.max(
          toFiniteNumber(legacyLayout?.outerDiameterMm, toFiniteNumber(legacyLayout?.cutoutDiameterMm, defaultLayout.outerDiameterMm)),
          savedInnerDiameter,
        ),
        pageWidthMm: toFiniteNumber(legacyLayout?.pageWidthMm, defaultLayout.pageWidthMm),
        backgroundColor: isHexColor(legacyLayout?.backgroundColor)
          ? legacyLayout.backgroundColor
          : defaultLayout.backgroundColor,
        foregroundColor: isHexColor(legacyLayout?.foregroundColor)
          ? legacyLayout.foregroundColor
          : defaultLayout.foregroundColor,
        matchFontSize:
          typeof legacyLayout?.matchFontSize === "boolean" ? legacyLayout.matchFontSize : defaultLayout.matchFontSize,
      },
    };
  } catch {
    return { layoutUnit: "in", layout: defaultLayout };
  }
}

async function getEmbeddedIconSvgs(manifest: IconManifest, iconIds: string[], foregroundColor: string) {
  const icons = await Promise.all(
    iconIds.map(async (iconId) => {
      const response = await fetch(`${manifest.assetBasePath}/${iconId}.svg`);

      if (!response.ok) {
        throw new Error(`Icon ${iconId} request failed: ${response.status}`);
      }

      const tintedSvgText = tintSvgText(await response.text(), foregroundColor);

      return [iconId, { markup: getSvgBody(tintedSvgText), viewBox: getSvgViewBox(tintedSvgText) }] as const;
    }),
  );

  return Object.fromEntries(icons);
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

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PNG export image could not be loaded."));
    image.src = url;
  });
}

async function downloadPng(svg: string, categories: ApiCategory[], layout: MagnetLayout) {
  const { widthMm, heightMm } = getSheetSize(categories, layout);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("PNG export is not supported in this browser.");
  }

  canvas.width = Math.ceil((widthMm / mmPerInch) * pngDpi);
  canvas.height = Math.ceil((heightMm / mmPerInch) * pngDpi);
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImageFromUrl(svgUrl);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("PNG export could not be created."));
    }, "image/png");
  });
  const pngUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");

  link.href = pngUrl;
  link.download = "meal-category-magnets.png";
  link.click();
  URL.revokeObjectURL(pngUrl);
}

export function MagnetsScreen() {
  const [savedSettings] = useState(loadMagnetExportSettings);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [layoutUnit, setLayoutUnit] = useState<LayoutUnit>(savedSettings.layoutUnit);
  const [layout, setLayout] = useState<MagnetLayout>(savedSettings.layout);
  const [numericLayoutDrafts, setNumericLayoutDrafts] = useState<NumericLayoutDrafts>(
    getNumericLayoutDrafts(savedSettings.layout, savedSettings.layoutUnit),
  );
  const [colorDrafts, setColorDrafts] = useState<ColorDrafts>({
    backgroundColor: savedSettings.layout.backgroundColor,
    foregroundColor: savedSettings.layout.foregroundColor,
  });
  const [pngExportError, setPngExportError] = useState("");
  const [isPngExporting, setIsPngExporting] = useState(false);
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
  const selectedIconIds = [...new Set(selectedCategories.flatMap((category) => (category.iconId ? [category.iconId] : [])))].sort();
  const embeddedIconSvgsQuery = useQuery({
    queryKey: ["magnet-icon-svgs", iconManifestQuery.data?.assetBasePath, selectedIconIds, layout.foregroundColor],
    queryFn: () => {
      if (!iconManifestQuery.data) {
        throw new Error("Icon manifest is required before loading magnet icons.");
      }

      return getEmbeddedIconSvgs(iconManifestQuery.data, selectedIconIds, layout.foregroundColor);
    },
    enabled: Boolean(iconManifestQuery.data && selectedIconIds.length > 0),
  });
  const svg =
    embeddedIconSvgsQuery.data && selectedCategories.length > 0
      ? buildMagnetSvg(selectedCategories, embeddedIconSvgsQuery.data, layout, layoutUnit)
      : "";
  const isPreparingSvg = iconManifestQuery.isLoading || embeddedIconSvgsQuery.isLoading;
  const unitLabel = layoutUnit === "in" ? "in" : "mm";
  const rowLayout = getRowLayout(layout.pageWidthMm, layout.outerDiameterMm);

  useEffect(() => {
    if (!hasInitializedSelection && iconReadyCategories.length > 0) {
      setSelectedCategoryIds(new Set(iconReadyCategories.map((category) => category.id)));
      setHasInitializedSelection(true);
    }
  }, [hasInitializedSelection, iconReadyCategories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify({ layoutUnit, layout }));
    } catch {
      // Export settings are a convenience; the screen should still work if browser storage is unavailable.
    }
  }, [layout, layoutUnit]);

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

  function updateLayoutUnit(nextUnit: LayoutUnit) {
    setLayoutUnit(nextUnit);
    setNumericLayoutDrafts(getNumericLayoutDrafts(layout, nextUnit));
  }

  function updateNumericLayoutDraft(field: NumericLayoutField, value: string) {
    setNumericLayoutDrafts((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function commitNumericLayoutDraft(field: NumericLayoutField) {
    const rawValue = Number(numericLayoutDrafts[field]);

    setLayout((current) => {
      const bounds = getDisplayValueBounds(field, current, layoutUnit);

      if (!Number.isFinite(rawValue)) {
        setNumericLayoutDrafts(getNumericLayoutDrafts(current, layoutUnit));
        return current;
      }

      const displayValue = clamp(rawValue, bounds.min, bounds.max);
      const valueMm = displayUnitToMm(displayValue, layoutUnit);
      let nextLayout: MagnetLayout;

      if (field === "innerDiameterMm") {
        nextLayout = {
          ...current,
          innerDiameterMm: valueMm,
          outerDiameterMm: Math.max(current.outerDiameterMm, valueMm),
        };
      } else if (field === "outerDiameterMm") {
        nextLayout = {
          ...current,
          outerDiameterMm: Math.max(valueMm, current.innerDiameterMm),
        };
      } else {
        nextLayout = {
          ...current,
          pageWidthMm: valueMm,
        };
      }

      setNumericLayoutDrafts(getNumericLayoutDrafts(nextLayout, layoutUnit));
      return nextLayout;
    });
  }

  function commitColorField(field: keyof ColorDrafts) {
    setLayout((current) => ({
      ...current,
      [field]: colorDrafts[field],
    }));
  }

  function handleNumericLayoutKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  async function handleDownloadPng() {
    if (!svg || isPngExporting) {
      return;
    }

    setPngExportError("");
    setIsPngExporting(true);

    try {
      await downloadPng(svg, selectedCategories, layout);
    } catch (error) {
      setPngExportError(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setIsPngExporting(false);
    }
  }

  return (
    <div className="screen-layout magnet-screen">
      <SectionCard
        title="Magnet Export"
        subtitle="Select category icons, tune the print layout, and export a reusable SVG sheet."
        className="magnet-controls-card"
      >
        <div className="magnet-controls">
          <div className="unit-toggle" aria-label="Measurement unit">
            <button
              type="button"
              className={layoutUnit === "in" ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => updateLayoutUnit("in")}
            >
              Inches
            </button>
            <button
              type="button"
              className={layoutUnit === "mm" ? "filter-chip filter-chip-active" : "filter-chip"}
              onClick={() => updateLayoutUnit("mm")}
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
                value={numericLayoutDrafts.pageWidthMm}
                onChange={(event) => updateNumericLayoutDraft("pageWidthMm", event.target.value)}
                onBlur={() => commitNumericLayoutDraft("pageWidthMm")}
                onKeyDown={handleNumericLayoutKeyDown}
              />
            </label>
            <label>
              <span className="label-with-tooltip">
                Inner diameter ({unitLabel})
                <span
                  className="tooltip-dot"
                  title="Finished button or magnet face. Icons and labels are scaled to fit inside this circle."
                  aria-label="Inner diameter is the finished face. Icons and labels fit inside this circle."
                >
                  ?
                </span>
              </span>
              <input
                type="number"
                min={layoutUnit === "in" ? "0.75" : "20"}
                max={layoutUnit === "in" ? "5" : "120"}
                step={layoutUnit === "in" ? "0.05" : "1"}
                value={numericLayoutDrafts.innerDiameterMm}
                onChange={(event) => updateNumericLayoutDraft("innerDiameterMm", event.target.value)}
                onBlur={() => commitNumericLayoutDraft("innerDiameterMm")}
                onKeyDown={handleNumericLayoutKeyDown}
              />
            </label>
            <label>
              <span className="label-with-tooltip">
                Outer diameter ({unitLabel})
                <span
                  className="tooltip-dot"
                  title="Cutout size. The background extends to this circle, and it cannot be smaller than the inner diameter."
                  aria-label="Outer diameter is the cutout size. Background extends to this circle."
                >
                  ?
                </span>
              </span>
              <input
                type="number"
                min={mmToDisplayUnit(layout.innerDiameterMm, layoutUnit)}
                max={layoutUnit === "in" ? "6" : "150"}
                step={layoutUnit === "in" ? "0.05" : "1"}
                value={numericLayoutDrafts.outerDiameterMm}
                onChange={(event) => updateNumericLayoutDraft("outerDiameterMm", event.target.value)}
                onBlur={() => commitNumericLayoutDraft("outerDiameterMm")}
                onKeyDown={handleNumericLayoutKeyDown}
              />
            </label>
            <div className="color-field-row">
              <label>
                <span>BG</span>
                <input
                  type="color"
                  value={colorDrafts.backgroundColor}
                  onChange={(event) =>
                    setColorDrafts((current) => ({ ...current, backgroundColor: event.target.value }))
                  }
                  onBlur={() => commitColorField("backgroundColor")}
                />
              </label>
              <label>
                <span>FG</span>
                <input
                  type="color"
                  value={colorDrafts.foregroundColor}
                  onChange={(event) =>
                    setColorDrafts((current) => ({ ...current, foregroundColor: event.target.value }))
                  }
                  onBlur={() => commitColorField("foregroundColor")}
                />
              </label>
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={layout.matchFontSize}
              onChange={(event) =>
                setLayout((current) => ({
                  ...current,
                  matchFontSize: event.target.checked,
                }))
              }
            />
            <span>Match font size across magnets</span>
          </label>

          <p className="muted-text">
            Layout fits {rowLayout.columns} magnet{rowLayout.columns === 1 ? "" : "s"} per row with{" "}
            {mmToDisplayUnit(rowLayout.gapMm, layoutUnit)} {unitLabel} horizontal gap. Gutter is{" "}
            {mmToDisplayUnit(magnetGutterMm, layoutUnit)} {unitLabel}. Artwork fits inside the inner diameter; the
            background extends to the outer diameter.
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
            <button type="button" className="secondary-button" disabled={!svg || isPngExporting} onClick={handleDownloadPng}>
              {isPngExporting ? "Preparing PNG..." : "Download PNG"}
            </button>
          </div>
          {pngExportError ? <p className="muted-text">{pngExportError}</p> : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Preview"
        subtitle={`${selectedCategories.length} magnet${selectedCategories.length === 1 ? "" : "s"} selected`}
        className="magnet-preview-card"
      >
        {iconManifestQuery.isLoading ? <p>Loading icon manifest...</p> : null}
        {iconManifestQuery.isError ? <p className="muted-text">Icon manifest could not be loaded.</p> : null}
        {embeddedIconSvgsQuery.isLoading ? <p>Loading icon artwork...</p> : null}
        {embeddedIconSvgsQuery.isError ? <p className="muted-text">Icon artwork could not be loaded.</p> : null}
        {!isPreparingSvg && !svg ? (
          <EmptyState title="Nothing to preview" message="Select at least one category with an icon." />
        ) : null}
        {svg ? <div className="magnet-preview" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      </SectionCard>

      <SectionCard
        title="Categories"
        subtitle="Only categories with assigned icon IDs can be included."
        className="magnet-categories-card"
      >
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
    </div>
  );
}
