# Deployment

Production is GitHub Pages:

https://nagaitashouten-star.github.io/miori-word-garden/

## Branches

- `main` — source of truth for active development.
- `gh-pages` — mirror of the currently published source state.
- `archive/netlify-era-2026-09-14` — snapshot of the old Netlify-era repository.
- `archive/pre-spellgarden-rebuild-2026-09-14` — snapshot before the Spell Garden inspired rebuild work.

## Publishing

A push to `main` runs `.github/workflows/pages.yml`, which uploads the repository as the GitHub Pages artifact and deploys it. Keep `gh-pages` mirrored to the latest verified `main` commit after significant releases.

## Current release direction

The visual UI follows Miori Spell Garden while Word Garden keeps its current adaptive learning data and independent Apple Pencil letter-box input architecture.

Progress is browser-local (`mwg-v2-rebuild`), so exporting a backup is recommended before changing devices or origins.
