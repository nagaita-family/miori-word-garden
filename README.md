# Miori's Word Garden

A small spelling practice game designed around Miori's weekly school words, Apple Pencil handwriting, adaptive review, human pronunciation when available, and a growing reward garden.

## Live site

Production: https://family.nagaita.jp/miori-word-garden/

Family apps home: https://family.nagaita.jp/

Repository: `nagaita-family/miori-word-garden`

`main` is the working branch. GitHub Pages is deployed by `.github/workflows/pages.yml`.

## Hosting and path rules

This app is hosted under the `/miori-word-garden/` subdirectory on `family.nagaita.jp`.

- Use relative paths for HTML, CSS, JavaScript, manifest, images, audio, and other assets.
- Avoid domain-root absolute paths such as `/asset.png` unless there is a specific reason.
- PWA `start_url` is `./`.
- If `scope` is added to the manifest, use `./`.
- Verify production changes at `https://family.nagaita.jp/miori-word-garden/`.

## Current product shape

- **Garden** — the main/top screen, with plant growth, draggable friends, treasures, and interactive reward items.
- **Play** — four stages: Listen & Choose, Fill the Gap, Trace / Write the Gap, Full Spelling.
- **Parent** — gentle learning support, weekly words, Word Library, pronunciation, and Word Pack import/export.

## UI direction

The current visual layer intentionally follows the strongest parts of **Miori Spell Garden**: soft lilac/pink/green colors, a richer top Garden screen, clear stage progress, a large pronunciation control, and an always-visible visual clue card during Play. The clue card keeps the picture cue, school English meaning, and Japanese support together so Miori can understand the word without opening extra help first.

The Spell Garden look is applied as separate theme layers on top of the working Word Garden app. That keeps the accumulated Apple Pencil behavior and learning logic stable while allowing the visual experience to evolve independently.

## Apple Pencil writing

Stage 3 and 4 use one real native text field per visible letter box. A letter box owns only its own character, so writing or erasing one box does not directly rewrite neighboring boxes.

Filled boxes are treated as locked display-like Pencil targets rather than editable text. That removes the native text caret from letters that have already been written and reduces the chance that an Apple Pencil scratch becomes iPadOS text selection before erase recognition. Scratching a filled box is handled as a one-box erase gesture; after it clears, that box becomes the next editable Scribble field. Explicit Eraser mode remains as a reliable one-box fallback.

Palm/finger suppression is scoped to the handwriting surface instead of the whole screen. Normal controls such as Check, Hint, Eraser, Exit, and the top navigation remain tappable.

## Learning chunks

Stage 2 and Stage 3 choose gaps inside meaningful spelling chunks instead of blindly taking adjacent letters. For example, `ladybug` is treated as `lady | bug`, so a gap will not cross the boundary and produce an unnatural target such as `yb`. The same idea is used for the current school words (for example `honey | bee`, `grass | hopper`, and `butter | fly`) while still prioritizing Miori's real mistakes and weak letters.

## Pronunciation

When a clear human pronunciation recording is available from Wikimedia Commons, it is used first. Otherwise the selected English device voice is used. Human recordings are searched automatically for this week's words and can also be searched manually in Parent.

## Data

Progress is stored locally in the browser under `mwg-v2-rebuild`.

Because browser storage is origin-specific, moving between hosting origins may not carry local progress automatically. Export a backup before clearing browser data or changing hosting origin.
