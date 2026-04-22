import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "../../components/EmptyState";
import { SectionCard } from "../../components/SectionCard";
import { getCategories, getIconManifest, type ApiCategory, type IconManifest } from "../shared/api";

type MagnetLayout = {
  innerDiameterMm: number;
  outerDiameterMm: number;
  pageWidthMm: number;
  backgroundColor: string;
  foregroundColor: string;
  matchFontSize: boolean;
};

type LayoutUnit = "in" | "mm";

type MagnetExportSettings = {
  layoutUnit: LayoutUnit;
  layout: MagnetLayout;
};

type NumericLayoutField = "innerDiameterMm" | "outerDiameterMm" | "pageWidthMm";

type EmbeddedIconSvg = {
  dataUri: string;
};

const defaultLayout: MagnetLayout = {
  innerDiameterMm: 25.4,
  outerDiameterMm: 31.75,
  pageWidthMm: 215.9,
  backgroundColor: "#fff8ed",
  foregroundColor: "#1f1b18",
  matchFontSize: true,
};

const localStorageKey = "family-meal-planner:magnet-export-settings";
const mmPerInch = 25.4;
const pngDpi = 300;
const magnetGutterMm = 1.5;
const iconSizeRatio = 0.42;
const iconOffsetRatio = 0.18;
const maxLabelWidthRatio = 0.8;
const maxLabelSizeRatio = 0.095;
const minLabelSizeMm = 2.3;
const averageGlyphWidthRatio = 0.56;

function isLayoutUnit(value: unknown): value is LayoutUnit {
  return value === "in" || value === "mm";
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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

function svgTextToDataUri(svgText: string) {
  const bytes = new TextEncoder().encode(svgText);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `data:image/svg+xml;base64,${window.btoa(binary)}`;
}

function tintSvgText(svgText: string, color: string) {
  return svgText.replace(/<svg\b([^>]*)>/i, `<svg$1 fill="${color}" color="${color}">`);
}

async function getEmbeddedIconSvgs(manifest: IconManifest, iconIds: string[], foregroundColor: string) {
  const icons = await Promise.all(
    iconIds.map(async (iconId) => {
      const response = await fetch(`${manifest.assetBasePath}/${iconId}.svg`);

      if (!response.ok) {
        throw new Error(`Icon ${iconId} request failed: ${response.status}`);
      }

      return [iconId, { dataUri: svgTextToDataUri(tintSvgText(await response.text(), foregroundColor)) }] as const;
    }),
  );

  return Object.fromEntries(icons);
}

function getRowLayout(pageWidthMm: number, diameterMm: number) {
  const usableWidthMm = Math.max(diameterMm, pageWidthMm - magnetGutterMm * 2);
  const columns = Math.max(1, Math.floor((usableWidthMm + magnetGutterMm) / (diameterMm + magnetGutterMm)));
  const safeColumns = Math.max(1, columns);
  const gapMm = safeColumns > 1 ? (usableWidthMm - safeColumns * diameterMm) / (safeColumns - 1) : 0;
  const startX = safeColumns === 1 ? Math.max(magnetGutterMm, (pageWidthMm - diameterMm) / 2) : magnetGutterMm;

  return {
    columns: safeColumns,
    gapMm: Math.max(0, gapMm),
    startX,
  };
}

function getSheetSize(categories: ApiCategory[], layout: MagnetLayout) {
  const rowLayout = getRowLayout(layout.pageWidthMm, layout.outerDiameterMm);
  const rows = Math.max(1, Math.ceil(categories.length / rowLayout.columns));

  return {
    widthMm: layout.pageWidthMm,
    heightMm: rows * layout.outerDiameterMm + (rows - 1) * magnetGutterMm + magnetGutterMm * 2,
  };
}

function getLabelFontSize(categoryName: string, diameterMm: number) {
  const maxLabelWidth = diameterMm * maxLabelWidthRatio;
  const maxFontSize = diameterMm * maxLabelSizeRatio;
  const estimatedWidthAtMaxSize = categoryName.length * maxFontSize * averageGlyphWidthRatio;
  const fittedFontSize =
    estimatedWidthAtMaxSize > maxLabelWidth
      ? maxLabelWidth / Math.max(1, categoryName.length * averageGlyphWidthRatio)
      : maxFontSize;

  return Math.max(minLabelSizeMm, Math.min(maxFontSize, fittedFontSize));
}

function getLabelFontSizes(categories: ApiCategory[], layout: MagnetLayout) {
  const fontSizes = new Map<string, number>();
  const perCategorySizes = categories.map((category) => getLabelFontSize(category.name, layout.innerDiameterMm));
  const matchedFontSize = layout.matchFontSize ? Math.min(...perCategorySizes) : undefined;

  categories.forEach((category, index) => {
    fontSizes.set(
      category.id,
      matchedFontSize ?? perCategorySizes[index] ?? getLabelFontSize(category.name, layout.innerDiameterMm),
    );
  });

  return fontSizes;
}

function getCompressedTextLength(categoryName: string, fontSizeMm: number, diameterMm: number, allowCompression: boolean) {
  if (!allowCompression) {
    return "";
  }

  const maxLabelWidth = diameterMm * maxLabelWidthRatio;
  const estimatedLabelWidth = categoryName.length * fontSizeMm * averageGlyphWidthRatio;

  return estimatedLabelWidth > maxLabelWidth ? ` textLength="${maxLabelWidth}" lengthAdjust="spacingAndGlyphs"` : "";
}

function buildMagnetSvg(
  categories: ApiCategory[],
  iconSvgs: Record<string, EmbeddedIconSvg>,
  layout: MagnetLayout,
  unit: LayoutUnit,
) {
  const innerDiameter = layout.innerDiameterMm;
  const outerDiameter = layout.outerDiameterMm;
  const rowLayout = getRowLayout(layout.pageWidthMm, outerDiameter);
  const columns = rowLayout.columns;
  const { widthMm, heightMm } = getSheetSize(categories, layout);
  const iconSize = innerDiameter * iconSizeRatio;
  const iconOffset = innerDiameter * iconOffsetRatio;
  const contentOffset = (outerDiameter - innerDiameter) / 2;
  const labelFontSizes = getLabelFontSizes(categories, layout);

  const magnets = categories
    .map((category, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = rowLayout.startX + column * (outerDiameter + rowLayout.gapMm);
      const y = magnetGutterMm + row * (outerDiameter + magnetGutterMm);
      const outerCenter = outerDiameter / 2;
      const innerX = x + contentOffset;
      const innerY = y + contentOffset;
      const innerCenter = innerDiameter / 2;
      const iconX = innerX + innerCenter - iconSize / 2;
      const iconY = innerY + innerCenter - iconSize / 2 - iconOffset;
      const labelY = innerY + innerDiameter * 0.72;
      const labelFontSize = labelFontSizes.get(category.id) ?? getLabelFontSize(category.name, innerDiameter);
      const compressedTextLength = getCompressedTextLength(category.name, labelFontSize, innerDiameter, !layout.matchFontSize);
      const iconSvg = category.iconId ? iconSvgs[category.iconId] : undefined;
      const icon = iconSvg
        ? `
  <image href="${iconSvg.dataUri}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" />`
        : "";

      return `
  <g transform="translate(${x} ${y})">
    <circle cx="${outerCenter}" cy="${outerCenter}" r="${outerDiameter / 2}" fill="${escapeXml(layout.backgroundColor)}" />
  </g>
  ${icon}
  <text x="${innerX + innerCenter}" y="${labelY}" text-anchor="middle" font-family="Avenir Next, Trebuchet MS, sans-serif" font-size="${labelFontSize}" font-weight="700" fill="${escapeXml(layout.foregroundColor)}"${compressedTextLength}>${escapeXml(category.name)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgLength(widthMm, unit)}" height="${formatSvgLength(heightMm, unit)}" viewBox="0 0 ${widthMm} ${heightMm}" role="img" aria-label="Meal category magnet sheet">${magnets}
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
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

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

  function updateLayoutField(field: NumericLayoutField, value: number) {
    setLayout((current) => ({
      ...current,
      [field]: Number.isFinite(value) ? value : current[field],
    }));
  }

  function updateDiameterField(field: "innerDiameterMm" | "outerDiameterMm", value: number) {
    setLayout((current) => {
      if (!Number.isFinite(value)) {
        return current;
      }

      if (field === "innerDiameterMm") {
        return {
          ...current,
          innerDiameterMm: value,
          outerDiameterMm: Math.max(current.outerDiameterMm, value),
        };
      }

      return {
        ...current,
        outerDiameterMm: Math.max(value, current.innerDiameterMm),
      };
    });
  }

  function updateColorField(field: "backgroundColor" | "foregroundColor", value: string) {
    setLayout((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLinearLayoutField(field: NumericLayoutField, value: number) {
    const valueMm = displayUnitToMm(value, layoutUnit);

    if (field === "innerDiameterMm" || field === "outerDiameterMm") {
      updateDiameterField(field, valueMm);
      return;
    }

    updateLayoutField(field, valueMm);
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
                value={mmToDisplayUnit(layout.innerDiameterMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("innerDiameterMm", event.target.valueAsNumber)}
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
                value={mmToDisplayUnit(layout.outerDiameterMm, layoutUnit)}
                onChange={(event) => updateLinearLayoutField("outerDiameterMm", event.target.valueAsNumber)}
              />
            </label>
            <div className="color-field-row">
              <label>
                <span>BG</span>
                <input
                  type="color"
                  value={layout.backgroundColor}
                  onChange={(event) => updateColorField("backgroundColor", event.target.value)}
                />
              </label>
              <label>
                <span>FG</span>
                <input
                  type="color"
                  value={layout.foregroundColor}
                  onChange={(event) => updateColorField("foregroundColor", event.target.value)}
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
