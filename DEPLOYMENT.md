# Deployment

Production is GitHub Pages:

https://nagaitashouten-star.github.io/miori-word-garden/

## Branches

- `main` — working source of truth.
- `gh-pages` — published mirror of the finished `main` commit.
- `archive/netlify-era-2026-09-14` — older Netlify-era history.
- `archive/pre-spellgarden-rebuild-2026-09-14` — snapshot immediately before the current Spell Garden-inspired rebuild.

The repository has a Pages workflow. After a finished change is committed to `main`, mirror that commit to `gh-pages` and confirm the GitHub Pages deployment succeeds.

## App files

- `index.html` — shell and asset versions.
- `styles.css` — main UI.
- `app.js` — Garden, Play, Parent, adaptive learning, audio, and per-letter Apple Pencil fields.
- `pencil-touch-guard.css` / `pencil-touch-guard.js` — iPad-specific finger/palm rejection and native text-selection suppression during Stage 3/4 while preserving Pencil Scribble.
- `.nojekyll` — direct static publishing.

## Browser data

Learning progress and Garden state are local browser data. The app uses the storage key `mwg-v2-rebuild` and migrates older v2 state to the current format when possible on the same site origin.
