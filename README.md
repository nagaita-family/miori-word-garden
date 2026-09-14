# Miori's Word Garden

A small spelling practice game designed around Miori's weekly school words, Apple Pencil handwriting, adaptive review, and a growing reward garden.

## Live site

GitHub Pages: https://nagaitashouten-star.github.io/miori-word-garden/

`main` is the working branch and `gh-pages` is the published mirror.

## Current product shape

- **Garden** — one-screen reward garden with XP, growth, friends, and draggable items.
- **Play** — four stages: Listen & Choose, Fill the Gap, Write the Gap, Full Spelling.
- **Parent** — weekly words, Word Library, learning data, pronunciation, and Word Pack import/export.

## Apple Pencil writing

Stage 3 and 4 use one real native text field per visible letter box. A letter box therefore owns only its own character; writing or erasing one box does not directly rewrite neighboring boxes.

During handwriting stages, finger/palm touches are ignored at the document level so iPadOS is less likely to open text-selection, Cut/Copy/Paste, scroll, or gesture UI while Apple Pencil Scribble has a letter box focused. Native Apple Pencil Scribble remains enabled on the real input fields. An explicit Eraser mode remains available as a reliable Pencil-only fallback.

## Pronunciation

When a clear human pronunciation recording is available from Wikimedia Commons, it is used first. Otherwise the selected English device voice is used.

## Data

Progress is stored locally in the browser under `mwg-v2-rebuild`. Existing v2 data is migrated into the current format on the same origin. Export a backup before clearing browser data or moving between hosting origins.
