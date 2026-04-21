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

The first layout model should expose:

- circle diameter
- column count
- horizontal gap
- vertical gap
- text font size
- inner padding ratio for icon fit

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
- Database backups remain focused on user/application data instead of duplicating curated static artwork.

Costs:

- The frontend becomes responsible for some document-generation logic, not just screen rendering.
- Raw icon filenames like `10.svg`, `100.svg`, etc. are not very descriptive, so asset management will become awkward without metadata.
- Category records will have references that must be validated against the current manifest.
- If icons ever become user-uploaded rather than curated, the storage and validation model will need to change.

## Follow-up

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
