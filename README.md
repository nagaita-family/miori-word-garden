# Miori's Word Garden — v0.15.0 Human Voice Word Pack

Based on the v0.14.1 learning design, with the Growth Path / XP feedback from v0.14.8.

## New in v0.15.0
- **No OpenAI API key is required by the website.**
- Parent workflow is now: school PDF → ChatGPT → downloadable Word Pack JSON → Word Garden import.
- Word Garden automatically looks for a **real human English pronunciation** on Wikimedia Commons. U.S. English is preferred.
- If no human recording is found, Word Garden falls back to the best English speech-synthesis voice available on the device.
- The selected human audio source and license are stored with the word and shown in the Parent preview.
- Human word audio is preferred throughout Play, including the slower Hint path.
- Meanings and example sentences use the selected device voice.
- Manual `word | English meaning` import still works.

## Word Pack format
See `docs/WORD_PACK_V0150.md` and `docs/WORD_PACK_EXAMPLE_V0150.json`.

## Hosting
This is now a static Netlify site. There are no Netlify Functions and no OpenAI environment variables required.

## Web-first release
v0.15.0 is focused on the web version because human pronunciation lookup needs internet access. The learning data still stays in the browser; no account or cloud-save layer is added.
