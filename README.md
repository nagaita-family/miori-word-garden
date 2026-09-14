# Miori's Word Garden

A small spelling practice game designed around Miori's weekly school words, Apple Pencil handwriting, adaptive review, human pronunciation when available, and a growing reward garden.

## Live site

GitHub Pages: https://nagaitashouten-star.github.io/miori-word-garden/

`main` is the working branch and `gh-pages` is kept as a published mirror.

## Current product shape

- **Garden** — the main/top screen, with XP, plant growth, draggable friends and rewards.
- **Play** — four stages: Listen & Choose, Fill the Gap, Write the Gap, Full Spelling.
- **Parent** — weekly words, Word Library, learning data, pronunciation, and Word Pack import/export.

## UI direction

The current visual layer intentionally follows the strongest parts of **Miori Spell Garden**: soft lilac/pink/green colors, a richer top Garden screen, clear stage progress, a large pronunciation control, and an always-visible visual clue card during Play. The clue card keeps the picture cue, school English meaning, and Japanese support together so Miori can understand the word without opening extra help first.

The Spell Garden look is applied as a separate theme layer (`spellgarden-theme-v4.css`) on top of the working Word Garden app. That keeps the accumulated Apple Pencil behavior and learning logic stable while allowing the visual experience to move much closer to Spell Garden.

## Apple Pencil writing

Stage 3 and 4 keep the Word Garden handwriting architecture: one real native text field per visible letter box. A letter box therefore owns only its own character; writing or erasing one box does not directly rewrite neighboring boxes.

Palm/finger suppression is scoped to the handwriting surface instead of the whole screen. Normal controls such as Check, Hint, Eraser, Exit, and the top navigation remain tappable, while the letter area still tries to prevent iPadOS text-selection/callout interference. Native Apple Pencil Scribble stays enabled on the real input fields, and explicit Eraser mode remains available as a reliable one-box fallback.

## Pronunciation

When a clear human pronunciation recording is available from Wikimedia Commons, it is used first. Otherwise the selected English device voice is used. Human recordings are searched automatically for this week's words and can also be searched manually in Parent.

## Data

Progress is stored locally in the browser under `mwg-v2-rebuild`. Existing v2 data is migrated into the current format on the same origin. Export a backup before clearing browser data or moving between hosting origins.
