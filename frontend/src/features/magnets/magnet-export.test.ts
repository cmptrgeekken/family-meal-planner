import { describe, expect, it } from "vitest";

import {
  buildMagnetSvg,
  buildVectorLabelPath,
  buildVectorLabelSvg,
  defaultLayout,
  getFittedSvgTransform,
  getLabelFontSizes,
  getRowLayout,
  getSheetSize,
  getSvgBody,
  getSvgViewBox,
  magnetGutterMm,
  parseSvgViewBox,
  sanitizeInlineSvg,
  tintSvgText,
  type MagnetLayout,
} from "./magnet-export";
import type { ApiCategory } from "../shared/api";

function category(id: string, name: string, iconId = id): ApiCategory {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    iconId,
  };
}

describe("magnet export layout", () => {
  it("calculates columns, gaps, and starting position from page and outer diameter", () => {
    const layout = getRowLayout(100, 30);

    expect(layout.columns).toBe(3);
    expect(layout.startX).toBe(magnetGutterMm);
    expect(layout.gapMm).toBeCloseTo(3.5);
  });

  it("centers a single column when the page is narrow", () => {
    const layout = getRowLayout(40, 30);

    expect(layout.columns).toBe(1);
    expect(layout.startX).toBe(5);
    expect(layout.gapMm).toBe(0);
  });

  it("uses outer diameter for sheet height and preserves page width", () => {
    const categories = [category("1", "Pasta"), category("2", "Rice"), category("3", "Pizza")];
    const layout: MagnetLayout = {
      ...defaultLayout,
      pageWidthMm: 70,
      outerDiameterMm: 30,
    };

    expect(getSheetSize(categories, layout)).toEqual({
      widthMm: 70,
      heightMm: 64.5,
    });
  });

  it("matches label font sizes when requested", () => {
    const categories = [category("short", "Rice"), category("long", "Breakfast For Dinner")];
    const matchedSizes = getLabelFontSizes(categories, { ...defaultLayout, matchFontSize: true });
    const independentSizes = getLabelFontSizes(categories, { ...defaultLayout, matchFontSize: false });

    expect(matchedSizes.get("short")).toBe(matchedSizes.get("long"));
    expect(independentSizes.get("short")).toBeGreaterThan(independentSizes.get("long") ?? 0);
  });
});

describe("buildMagnetSvg", () => {
  it("generates a self-contained SVG with transformed inline icon vectors and escaped labels", () => {
    const svg = buildMagnetSvg(
      [category("pasta", "Pasta & Sauce", "168")],
      {
        "168": {
          markup: '<path d="M0 0h10v10z" />',
          viewBox: "0 0 10 10",
        },
      },
      defaultLayout,
      "in",
    );

    expect(svg).toContain('width="8.500in"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('transform="translate(');
    expect(svg).toContain('<path d="M0 0h10v10z" />');
    expect(svg).toContain('aria-label="Pasta &amp; Sauce"');
    expect(svg).not.toContain("<svg x=");
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("<text");
    expect(svg).not.toContain("/icons/");
  });
});

describe("vector labels", () => {
  it("renders label text as Cricut-friendly path geometry", () => {
    const label = buildVectorLabelSvg("BLTs", 10, 12, 2.4, 18, "#111111");

    expect(label).toContain("<path");
    expect(label).toContain('fill="#111111"');
    expect(label).toContain('aria-label="BLTs"');
    expect(label).not.toContain("<text");
  });

  it("compresses long vector labels to the requested maximum width", () => {
    const wideLabel = buildVectorLabelPath("BREAKFAST DINNER", 0, 0, 2.4, 12);
    const xValues = [...wideLabel.matchAll(/M(-?\d+\.\d+)/g)].map((match) => Number(match[1]));

    expect(Math.max(...xValues) - Math.min(...xValues)).toBeLessThanOrEqual(12);
  });
});

describe("inline SVG helpers", () => {
  it("extracts SVG viewBox and body content", () => {
    const svg = '<?xml version="1.0"?><svg viewBox="0 0 42 24"><defs /><path d="M0 0" /></svg>';

    expect(getSvgViewBox(svg)).toBe("0 0 42 24");
    expect(getSvgBody(svg)).toBe('<defs /><path d="M0 0" />');
  });

  it("strips editor metadata and undefined namespace attributes from icon markup", () => {
    const svg =
      '<svg viewBox="0 0 10 10" xmlns:inkscape="x" xmlns:sodipodi="y"><sodipodi:namedview inkscape:zoom="1"><inkscape:page /></sodipodi:namedview><g inkscape:label="Layer"><path d="M0 0" /></g></svg>';

    expect(sanitizeInlineSvg(svg)).not.toContain("sodipodi:");
    expect(sanitizeInlineSvg(svg)).not.toContain("inkscape:");
    expect(getSvgBody(svg)).toBe('<g><path d="M0 0" /></g>');
  });

  it("fits non-square viewBox content into a target box", () => {
    expect(parseSvgViewBox("10 20 200 100")).toEqual({ minX: 10, minY: 20, width: 200, height: 100 });
    expect(getFittedSvgTransform("10 20 200 100", 5, 7, 20, 20)).toBe("translate(4 10) scale(0.1)");
  });
});

describe("tintSvgText", () => {
  it("overrides hardcoded icon fills while preserving fill none", () => {
    const svg = tintSvgText(
      '<svg viewBox="0 0 10 10"><path style="fill:#000000;stroke:#111111" d="M0 0" /><path fill="none" stroke="#000" d="M1 1" /></svg>',
      "#ff00ea",
    );

    expect(svg).toContain('fill="#ff00ea"');
    expect(svg).toContain('color="#ff00ea"');
    expect(svg).toContain("fill:currentColor");
    expect(svg).toContain("stroke:currentColor");
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="currentColor"');
  });
});
