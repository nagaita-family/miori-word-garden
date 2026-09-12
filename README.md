# Miori's Word Garden — v0.15.3 Kawaii Garden

Based on the v0.14.1 learning design, v0.14.8 Growth/XP feedback, v0.15.0 Human Voice Word Pack, and v0.15.2 Garden layout.

## New in v0.15.3
- **Growth Journey moved completely outside the Garden picture.** It is now a compact strip below the activity buttons, so it can never cover the veggie beds, plants, animals, or draggable gifts.
- **New kawaii character set.** Rabbit, cat, squirrel, duck, hedgehog, bird, and dog now use larger sticker-like chibi SVG art with blush, highlights, accessories, soft glow, and state-specific water / happy / eat poses.
- **Collectible items redesigned.** Bench, birdcage, mailbox, lantern, flower arch, treehouse, and the weekly present now look like illustrated pastel garden toys rather than plain emoji.
- **Character/item safe placement migration.** Existing unlocked friends and gifts are moved once into separate visual zones so the new larger art starts without stacking on top of each other. They remain draggable afterward.
- Seed visibility improvements from v0.15.2 are retained.
- The Garden remains Chromebook-first and aims to show the main play area without scrolling on normal desktop/Chromebook viewports.

## Pronunciation / Word Pack
- No OpenAI API key is required by the website.
- Parent workflow: school PDF → ChatGPT → downloadable Word Pack JSON → Word Garden import.
- Word Garden prefers a real human English pronunciation from Wikimedia Commons and falls back to the best English device/browser voice.
- Meanings, examples, phonics focus, and picture cues can be supplied by the ChatGPT Word Pack.

## Word Pack format
See `docs/WORD_PACK_V0150.md` and `docs/WORD_PACK_EXAMPLE_V0150.json`.

## Hosting
Static Netlify site. No Netlify Functions and no OpenAI environment variables are required.
