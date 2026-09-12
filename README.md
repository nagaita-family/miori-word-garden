# Miori's Word Garden — v0.15.2 Garden Joy + Clear Zones

Based on the v0.14.1 learning design, v0.14.8 Growth/XP feedback, and v0.15.0 Human Voice Word Pack.

## New in v0.15.2
- **More exciting TOP Garden:** a bright “Today's Garden Adventure” header, mood badge, playful navigation, and a cleaner visual hierarchy.
- **No UI covering the garden:** Garden picture and Growth Journey now sit side-by-side; the learning route shelf sits below the picture instead of covering plants.
- **Planted seeds stay visible:** a planted seed gets a glowing soil halo, sprout badge, and PLANTED marker until it grows.
- **Clear zones:** Seed House, flower meadow, residents/rewards, and two veggie beds are repositioned so the main garden elements do not stack on top of each other.
- **Watering coordinates fixed** for the new two-bed layout.

## From v0.15.1
- **Garden + Growth Path are now one scene.** The level journey is embedded on the right side of the illustrated Garden instead of living in a separate card below it.
- **Chromebook-first no-scroll Garden dashboard.** On normal desktop/Chromebook sizes, the Garden, current destination, next destination, XP, and learning routes fit in one viewport.
- **Two larger veggie beds** replace the old four small plots. Older crops are safely compacted into the two active beds; overflow crops return to the Seed House as seeds when possible.
- The progress story now emphasizes places: **Little Garden → Flower Terrace → Rainbow Lookout → Sky Garden**. The numeric Garden Level is still shown, but the destination is the visual focus.
- Focus Words / Quick Review / Bonus Sun / Challenge controls now sit inside the lower edge of the Garden scene.
- The daily status strip is compact so the Garden stays the main visual reward.

## v0.15.0 pronunciation / Word Pack features retained
- No OpenAI API key is required by the website.
- Parent workflow: school PDF → ChatGPT → downloadable Word Pack JSON → Word Garden import.
- Word Garden looks for a real human English pronunciation on Wikimedia Commons, preferring U.S. English.
- If no human recording is found, it falls back to the best English device/browser voice.
- Meanings, examples, phonics focus, and picture cues can be supplied by the ChatGPT Word Pack.

## Word Pack format
See `docs/WORD_PACK_V0150.md` and `docs/WORD_PACK_EXAMPLE_V0150.json`.

## Hosting
Static Netlify site. No Netlify Functions and no OpenAI environment variables are required.
