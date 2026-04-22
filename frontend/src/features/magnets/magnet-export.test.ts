import { describe, expect, it } from "vitest";

import {
  buildMagnetSvg,
  defaultLayout,
  getLabelFontSizes,
  getRowLayout,
  getSheetSize,
  magnetGutterMm,
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
  it("generates a self-contained SVG with embedded icon data and escaped labels", () => {
    const svg = buildMagnetSvg(
      [category("pasta", "Pasta & Sauce", "168")],
      {
        "168": {
          dataUri: "data:image/svg+xml;base64,PHN2Zy8+",
        },
      },
      defaultLayout,
      "in",
    );

    expect(svg).toContain('width="8.500in"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('href="data:image/svg+xml;base64,PHN2Zy8+"');
    expect(svg).not.toContain("/icons/");
    expect(svg).toContain("Pasta &amp; Sauce");
  });
});
