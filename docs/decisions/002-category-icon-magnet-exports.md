# 002: Category Icon Assignments and SVG Magnet Exports

## Context

The product direction already calls for a kid-friendly, magnet-like planning experience.
To support that, the app now has a library of icon assets intended for visual meal-category representation and printable/exportable "magnet" graphics.

The requested export behavior is:

- assign one icon to a category
- allow selecting multiple categories for export
- render each selected category as a circular magnet with:
  - a user-specified circle diameter
  - the icon centered within the circle and scaled to fit
  - the category label beneath the icon
- repeat the magnet layout in a configurable grid with:
  - user-specified column count
  - as many rows as needed
  - user-specified horizontal and vertical spacing

We also need to decide where icon assets should live and how tightly category records should be coupled to those files.

## Decision

For the first implementation:

- Treat category icons as curated static assets owned by the frontend.
- Keep the source icon files in `frontend/public/icons`.
- Use SVG source files as the canonical export input.
- Model category-to-icon assignment as data, not hard-coded UI mapping.
- Store stable icon IDs on category records when category icon assignment is implemented.
- Do not store curated icon files or SVG contents in the database for MVP.
- Generate exports in the frontend as SVG documents assembled from category metadata and layout settings.

The first export scope should be:

- one icon per category
- one label per category
- one circular badge per exported category
- one combined SVG output containing all requested magnets in a grid
- self-contained downloaded SVGs with icon artwork embedded as data URIs, not linked to app-local `/icons/...` paths
- PNG downloads rasterized from the same generated SVG for sharing, quick previews, and tools that do not handle SVG well

The first layout model should expose:

- inner diameter for visible icon and label content
- outer diameter for the printable/cutout background circle and layout footprint
- column count
- horizontal gap
- a single fixed gutter used for sheet edges, vertical gaps, and minimum horizontal gaps
- icon size derived from circle diameter
- label size derived from circle diameter and constrained to 80% of the circle width
- optional matched label sizing so every magnet uses the smallest computed label size
- configurable background and foreground colors, with foreground applied to labels and embedded icon artwork
- persisted local export settings for repeat use across browser refreshes

The export screen should treat the generated sheet as the primary artifact:

- Keep the SVG preview visible before the category selector on small screens.
- On wider screens, use a two-column workspace with controls and category selection on the left and a sticky preview on the right.
- Keep growing category lists scrollable or otherwise compact so additional categories do not push the preview below the fold.
- Keep Download SVG available from the controls without requiring users to scroll through the category list.

Recommended asset conventions:

- keep `frontend/public/icons` for now because the assets are runtime-selectable and export-oriented
- use `frontend/public/icons/manifest.json` so icon selection is based on stable IDs instead of manual numeric lookup
- prefer referencing SVG files only for export generation, even if PNG previews remain available for browsing

## Consequences

Benefits:

- Export generation stays deterministic and does not depend on server-side rendering infrastructure.
- Static public assets are easy to preview in the browser and easy to package into SVG exports.
- Category/icon mapping can evolve without changing code every time a category is renamed.
- The export feature can support both on-screen preview and downloadable SVG from the same rendering logic.
- Embedded icon data lets downloaded SVGs render correctly when opened from `file://`, sent to another device, or printed outside the running app.
- PNG export provides a broadly compatible fallback while preserving SVG as the editable source of truth.
- Preview-first layout makes export adjustments easier to validate and keeps the generated artifact from being hidden behind a growing category list.
- Database backups remain focused on user/application data instead of duplicating curated static artwork.

Costs:

- The frontend becomes responsible for some document-generation logic, not just screen rendering.
- Export generation must fetch and parse selected icon SVGs before the preview/download can be considered ready.
- PNG output is a raster snapshot, so it must pick a resolution; MVP uses 300 DPI based on the physical sheet dimensions.
- Raw icon filenames like `10.svg`, `100.svg`, etc. are not very descriptive, so asset management will become awkward without metadata.
- Category records will have references that must be validated against the current manifest.
- If icons ever become user-uploaded rather than curated, the storage and validation model will need to change.
- The export screen needs deliberate layout management as the category library grows; otherwise the selector becomes the dominant UI instead of the generated sheet.

## Follow-up

Track implementation status in [../project-checklist.md](../project-checklist.md).

Before implementation is complete, decide:

- whether multiple icons per category should ever be allowed
- whether export labels should use category name, display name, or a dedicated short print label
- whether text wrapping is allowed or labels must remain single-line
- whether the export should support print-sheet presets in addition to raw dimensions
- whether all geometry should be expressed in pixels, millimeters, inches, or a mix

Implementation follow-up:

- create an icon manifest for `frontend/public/icons`
- add category icon assignment to the category data model and admin UI
- build a magnet export preview/export screen
- centralize SVG layout math in a dedicated export utility instead of embedding it in components
- add snapshot-style tests for SVG output structure and layout calculations

## Discussion Points

These are the main design questions worth aligning on before building:

- Asset identity:
  Numeric filenames are workable as a temporary library dump, but they are weak long-term identifiers.
  A manifest such as `icons.json` would let us attach label, tags, preview path, and canonical SVG path to each icon.

- Data ownership:
  The cleanest model is for categories to store an icon reference in the database.
  That keeps export behavior stable across sessions and avoids hidden UI-only mappings.
  The database should store the stable icon ID from the manifest, not the SVG/PNG file contents.

- Export rendering boundary:
  Frontend-side SVG generation is a good default because the output is already a text document and does not require rasterization.
  A backend export service is probably unnecessary unless we later need PDFs, user uploads, or batch jobs.

- Print fidelity:
  If these are truly "magnet" exports, physical sizing matters.
  We should decide early whether the UI accepts a diameter in physical units and converts to SVG dimensions, or whether everything stays pixel-based for MVP.

- Layout constraints:
  Category names vary in length, so label treatment can easily affect magnet height.
  We should choose one of:
  - single-line labels with truncation
  - auto-resizing text
  - wrapped text with variable row height

- Icon normalization:
  Even with SVG inputs, icons may have inconsistent viewBox sizes, padding, or visual weight.
  We should expect to normalize fit with a configurable inner bounding box rather than assuming every icon behaves the same.

- Scope control:
  The simplest first release is category exports only.
  We should avoid immediately expanding the same tool to meals, occasions, or fully custom printable boards until the category flow feels solid.
