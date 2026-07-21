# ASCII Artwork Preservation Policy

ASCII artwork in this repository is a long-term project asset. Current runtime
usage does not determine whether an asset is valuable.

Do not delete unused, commented-out, experimental, duplicate, unfinished, or
legacy artwork without explicit approval from the project owner. When removing
a system, preserve its artwork in `reserve/` (or `archive/` for legacy-system
material) before removing its executable code. The words **reserve** and
**archive** mean "not currently used," never "safe to delete."

## Required workflow

Before deleting a file, export, constant, import source, or commented section:

1. Inspect the complete source for inline art, sprite arrays, scene drafts,
   alternate frames, and references to artwork.
2. Separate executable code from artwork. Obsolete executable code may be
   removed; artwork and unknown material must be retained.
3. Preserve the original bytes before converting formats or moving an asset.
4. If an asset is moved, update `inventory.json` so its former source remains
   recorded in version history and its new source is catalogued.
5. Run `node scripts/ascii-assets.mjs --check` before committing.

An unused import may be removed from executable code. Its source asset must not
be deleted merely because no imports remain. Do not use tree-shaking, coverage,
lint output, file age, duplication, or code-search results as evidence that art
is disposable.

## Editing and conversion safety

- Do not replace art with placeholders, shorten rows, trim trailing spaces, or
  normalize characters automatically.
- Treat backslashes, Unicode display width, fixed row lengths, and trailing
  spaces as significant.
- Do not mass-convert assets. Keep the original and converted versions side by
  side until rendered output, every row, row lengths, backslashes, trailing
  spaces, and clickable-region alignment have been compared.
- When equivalence is uncertain, keep the original in `reserve/` or `archive/`.
- Do not automatically collapse duplicate or near-duplicate variants; they may
  be animation frames, state variants, or future content.

`inventory.json` catalogs every protected source file and its statically
discoverable exports. `manifest.json` records byte-level hashes, including
significant whitespace. Both are maintained by `scripts/ascii-assets.mjs`.
Intentional artwork changes require explicit review followed by:

```sh
node scripts/ascii-assets.mjs --update
node scripts/ascii-assets.mjs --check
```

## Metadata for preserved legacy assets

Use this header when extracting artwork from obsolete executable systems:

```js
// PRESERVED ASCII ASSET
// Previously used by <the original system or source file>.
// Not currently rendered, but retained for possible future reuse.
```

Reserve modules must also begin with:

```js
// PROTECTED ASSET RESERVE
// Artwork in this file is intentionally retained for future development.
// Do not delete assets based on current runtime usage.
```

