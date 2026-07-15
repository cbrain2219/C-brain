# Notice Text Clamp Design

## Goal

Keep notice cards compact when titles or excerpts are longer than the available width while preserving the complete source text for future API data.

## Rendering Rules

- Notice titles use a one-line CSS clamp at every breakpoint.
- Notice excerpts use a two-line CSS clamp below `640px`.
- Notice excerpts use a one-line CSS clamp from `640px` upward.
- Overflow is represented by the browser's ellipsis rather than modifying the stored string.
- Existing card spacing, metadata, pinned state, and category filtering remain unchanged.

## Fixture Coverage

Update a small number of local notice fixtures with deliberately long titles and excerpts. Other fixture items remain shorter so both overflowing and non-overflowing states can be checked on the same page.

## Verification

- At `320px`, verify titles occupy one line and excerpts occupy no more than two lines.
- At `768px` and `1920px`, verify both titles and excerpts occupy one line.
- Confirm overflowing elements compute to hidden overflow with the expected line clamp.
- Run lint, type checking, and the production build.
