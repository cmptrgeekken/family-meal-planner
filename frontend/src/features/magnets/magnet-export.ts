import type { ApiCategory } from "../shared/api";

export type MagnetLayout = {
  innerDiameterMm: number;
  outerDiameterMm: number;
  pageWidthMm: number;
  backgroundColor: string;
  foregroundColor: string;
  matchFontSize: boolean;
};

export type LayoutUnit = "in" | "mm";

export type EmbeddedIconSvg = {
  markup: string;
  viewBox: string;
};

type SvgViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export const defaultLayout: MagnetLayout = {
  innerDiameterMm: 25.4,
  outerDiameterMm: 31.75,
  pageWidthMm: 215.9,
  backgroundColor: "#fff8ed",
  foregroundColor: "#1f1b18",
  matchFontSize: true,
};

export const mmPerInch = 25.4;
export const pngDpi = 300;
export const magnetGutterMm = 1.5;

const iconSizeRatio = 0.42;
const iconOffsetRatio = 0.18;
const maxLabelWidthRatio = 0.8;
const maxLabelSizeRatio = 0.095;
const minLabelSizeMm = 2.3;
const averageGlyphWidthRatio = 0.56;
const vectorGlyphWidth = 5;
const vectorGlyphHeight = 7;
const vectorGlyphGap = 1;
const vectorSpaceWidth = 3;

const vectorGlyphs: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
};

export function mmToDisplayUnit(valueMm: number, unit: LayoutUnit) {
  return unit === "in" ? Number((valueMm / mmPerInch).toFixed(3)) : Number(valueMm.toFixed(1));
}

export function displayUnitToMm(value: number, unit: LayoutUnit) {
  return unit === "in" ? value * mmPerInch : value;
}

export function formatSvgLength(valueMm: number, unit: LayoutUnit) {
  if (unit === "in") {
    return `${(valueMm / mmPerInch).toFixed(3)}in`;
  }

  return `${valueMm.toFixed(2)}mm`;
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function tintSvgText(svgText: string, color: string) {
  const colorizedSvg = svgText
    .replace(/\sfill="(?!none\b)[^"]*"/gi, ' fill="currentColor"')
    .replace(/\sstroke="(?!none\b)[^"]*"/gi, ' stroke="currentColor"')
    .replace(/style="([^"]*)"/gi, (_match, style: string) => {
      const colorizedStyle = style
        .replace(/(^|;)\s*fill\s*:\s*(?!none\b)[^;"]+/gi, "$1fill:currentColor")
        .replace(/(^|;)\s*stroke\s*:\s*(?!none\b)[^;"]+/gi, "$1stroke:currentColor");

      return `style="${colorizedStyle}"`;
    });

  return colorizedSvg.replace(/<svg\b([^>]*)>/i, `<svg$1 fill="${color}" color="${color}">`);
}

export function sanitizeInlineSvg(svgText: string) {
  return svgText
    .replace(/<metadata\b[\s\S]*?<\/metadata>/gi, "")
    .replace(/<sodipodi:namedview\b[\s\S]*?<\/sodipodi:namedview>/gi, "")
    .replace(/<sodipodi:namedview\b[^>]*\/>/gi, "")
    .replace(/<inkscape:[^>]*>[\s\S]*?<\/inkscape:[^>]*>/gi, "")
    .replace(/<inkscape:[^>]*\/>/gi, "")
    .replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/gi, "")
    .replace(/\sxmlns:(?:inkscape|sodipodi|svg)="[^"]*"/gi, "");
}

export function getSvgViewBox(svgText: string) {
  return svgText.match(/<svg\b[^>]*\sviewBox="([^"]+)"/i)?.[1] ?? "0 0 100 100";
}

export function getSvgBody(svgText: string) {
  return sanitizeInlineSvg(svgText)
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
}

export function parseSvgViewBox(viewBox: string): SvgViewBox {
  const values = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const minX = values[0] ?? Number.NaN;
  const minY = values[1] ?? Number.NaN;
  const width = values[2] ?? Number.NaN;
  const height = values[3] ?? Number.NaN;

  if (
    values.length !== 4 ||
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { minX: 0, minY: 0, width: 100, height: 100 };
  }

  return { minX, minY, width, height };
}

export function getFittedSvgTransform(viewBox: string, x: number, y: number, width: number, height: number) {
  const parsedViewBox = parseSvgViewBox(viewBox);
  const scale = Math.min(width / parsedViewBox.width, height / parsedViewBox.height);
  const offsetX = x + (width - parsedViewBox.width * scale) / 2 - parsedViewBox.minX * scale;
  const offsetY = y + (height - parsedViewBox.height * scale) / 2 - parsedViewBox.minY * scale;

  return `translate(${offsetX} ${offsetY}) scale(${scale})`;
}

export function getSelectedCategories(categories: ApiCategory[], selectedCategoryIds: Set<string>) {
  return categories.filter((category) => selectedCategoryIds.has(category.id) && category.iconId);
}

export function getRowLayout(pageWidthMm: number, diameterMm: number) {
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

export function getSheetSize(categories: ApiCategory[], layout: MagnetLayout) {
  const rowLayout = getRowLayout(layout.pageWidthMm, layout.outerDiameterMm);
  const rows = Math.max(1, Math.ceil(categories.length / rowLayout.columns));

  return {
    widthMm: layout.pageWidthMm,
    heightMm: rows * layout.outerDiameterMm + (rows - 1) * magnetGutterMm + magnetGutterMm * 2,
  };
}

export function getLabelFontSize(categoryName: string, diameterMm: number) {
  const maxLabelWidth = diameterMm * maxLabelWidthRatio;
  const maxFontSize = diameterMm * maxLabelSizeRatio;
  const estimatedWidthAtMaxSize = categoryName.length * maxFontSize * averageGlyphWidthRatio;
  const fittedFontSize =
    estimatedWidthAtMaxSize > maxLabelWidth
      ? maxLabelWidth / Math.max(1, categoryName.length * averageGlyphWidthRatio)
      : maxFontSize;

  return Math.max(minLabelSizeMm, Math.min(maxFontSize, fittedFontSize));
}

export function getLabelFontSizes(categories: ApiCategory[], layout: MagnetLayout) {
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

function getVectorLabelWidth(label: string, cellSize: number) {
  return [...label.toUpperCase()].reduce((width, character, index) => {
    const characterWidth = character === " " ? vectorSpaceWidth : vectorGlyphWidth;
    const gap = index === label.length - 1 ? 0 : vectorGlyphGap;

    return width + (characterWidth + gap) * cellSize;
  }, 0);
}

export function buildVectorLabelPath(label: string, x: number, y: number, fontSizeMm: number, maxWidthMm: number) {
  const normalizedLabel = label.toUpperCase();
  const baseCellSize = (fontSizeMm * 1.15) / vectorGlyphHeight;
  const naturalWidth = getVectorLabelWidth(normalizedLabel, baseCellSize);
  const scaleX = naturalWidth > maxWidthMm ? maxWidthMm / naturalWidth : 1;
  const labelWidth = naturalWidth * scaleX;
  const labelHeight = vectorGlyphHeight * baseCellSize;
  const startX = x - labelWidth / 2;
  const startY = y - labelHeight * 0.78;
  const pathParts: string[] = [];
  let cursorX = 0;

  [...normalizedLabel].forEach((character, characterIndex) => {
    const glyph = vectorGlyphs[character] ?? vectorGlyphs["?"];
    const characterWidth = character === " " ? vectorSpaceWidth : vectorGlyphWidth;

    if (character !== " " && glyph) {
      glyph.forEach((row, rowIndex) => {
        [...row].forEach((cell, columnIndex) => {
          if (cell !== "1") {
            return;
          }

          const cellX = startX + (cursorX + columnIndex * baseCellSize) * scaleX;
          const cellY = startY + rowIndex * baseCellSize;
          const cellWidth = baseCellSize * scaleX;

          pathParts.push(
            `M${cellX.toFixed(3)} ${cellY.toFixed(3)}h${cellWidth.toFixed(3)}v${baseCellSize.toFixed(3)}h-${cellWidth.toFixed(3)}z`,
          );
        });
      });
    }

    cursorX += (characterWidth + (characterIndex === normalizedLabel.length - 1 ? 0 : vectorGlyphGap)) * baseCellSize;
  });

  return pathParts.join("");
}

export function buildVectorLabelSvg(label: string, x: number, y: number, fontSizeMm: number, maxWidthMm: number, color: string) {
  const path = buildVectorLabelPath(label, x, y, fontSizeMm, maxWidthMm);

  return path ? `<path d="${path}" fill="${escapeXml(color)}" aria-label="${escapeXml(label)}" />` : "";
}

export function buildMagnetSvg(
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
      const iconSvg = category.iconId ? iconSvgs[category.iconId] : undefined;
      const icon = iconSvg
        ? `
  <g transform="${getFittedSvgTransform(iconSvg.viewBox, iconX, iconY, iconSize, iconSize)}" color="${escapeXml(layout.foregroundColor)}" fill="${escapeXml(layout.foregroundColor)}">
    ${iconSvg.markup}
  </g>`
        : "";

      return `
  <g transform="translate(${x} ${y})">
    <circle cx="${outerCenter}" cy="${outerCenter}" r="${outerDiameter / 2}" fill="${escapeXml(layout.backgroundColor)}" />
  </g>
  ${icon}
  ${buildVectorLabelSvg(category.name, innerX + innerCenter, labelY, labelFontSize, innerDiameter * maxLabelWidthRatio, layout.foregroundColor)}`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgLength(widthMm, unit)}" height="${formatSvgLength(heightMm, unit)}" viewBox="0 0 ${widthMm} ${heightMm}" role="img" aria-label="Meal category magnet sheet">${magnets}
</svg>`;
}
