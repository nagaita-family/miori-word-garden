# Miori's Word Garden

A small iPad-first spelling practice game for Miori.

## Current app

The production app is the single self-contained `index.html` in this repository. It includes:

- Garden reward/collection screen
- 4-stage spelling practice loop
- Stage 3/4 Apple Pencil + iPad Scribble writing flow
- adaptive weak-letter practice data
- Parent screen for weekly words, Word Pack JSON import/export, and learning history
- browser `localStorage` persistence

No server, API key, build step, or external runtime dependency is required.

## Production URL

GitHub Pages is the primary host:

`https://nagaitashouten-star.github.io/miori-word-garden/`

See `DEPLOYMENT.md` for publishing and migration notes.

## Repository layout

- `index.html` — current production app
- `.nojekyll` — serve the static app as-is on GitHub Pages
- `README.md` — project overview
- `DEPLOYMENT.md` — hosting notes

The previous Netlify-era repository, including old patch scripts, workflows, legacy assets, and earlier standalone builds, is preserved on:

`archive/netlify-era-2026-09-14`

## Data note

Progress is stored in browser `localStorage`. GitHub Pages and Netlify have different origins, so existing Netlify progress does not automatically appear on GitHub Pages. Use **Parent → Export backup** on the old site and **Parent → Import JSON** on the new site when migration is needed.
