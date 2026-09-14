# Deployment notes

## Primary hosting

Miori's Word Garden now uses **GitHub Pages** as the primary public host.

Production URL:

`https://nagaitashouten-star.github.io/miori-word-garden/`

The app is a static, self-contained `index.html`, so no build step is required.

## Publishing branch

GitHub Pages publishes the root of the `gh-pages` branch.

Current production source is kept identical to the clean app files on `main`.

Files required for production:

- `index.html`
- `.nojekyll`

When ChatGPT updates the app in this project, keep `main` and `gh-pages` in sync so the public Pages URL receives the same version.

## Netlify migration

Netlify is no longer the primary production host.

The complete repository state from the end of the Netlify-centered workflow is preserved at:

`archive/netlify-era-2026-09-14`

That archive contains the old one-off patch workflows, patch scripts, legacy standalone builds, historical assets, and Netlify configuration that were intentionally removed from the clean `main` branch.

## Browser data migration

Learning progress lives in browser `localStorage` and is scoped to the website origin.

Therefore data from:

`https://miori-word-garden.netlify.app`

does not automatically transfer to:

`https://nagaitashouten-star.github.io/miori-word-garden/`

To move existing progress, use **Parent → Export backup** on the old origin, then **Parent → Import JSON** on the GitHub Pages origin.
