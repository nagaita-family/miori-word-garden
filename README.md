# Miori's Word Garden — v0.14.9 Web Word Pack

Based on **v0.14.8 Growth Feedback Update**. The v0.14.1 functional design remains the learning baseline.

## New in v0.14.9
- Parent can upload a school spelling PDF directly in the **web version**.
- The server creates a Word Pack with: school English meaning, Japanese meaning, a child-friendly example sentence, phonics focus, picture cue, and natural audio.
- School English meanings are source-preserving: when the PDF supplies wording, Word Garden keeps that wording rather than silently rewriting it.
- Four audio types are supported: normal word, slow Hint word, English meaning, and example sentence.
- Generated audio is stored locally in the browser (IndexedDB); no cloud account or cross-device progress is added in this phase.
- Word Pack audio is preferred throughout Play, including the Step 3/4 Hint. Browser speech synthesis remains the fallback.
- Manual `word | English meaning` import remains available.
- OpenAI API calls are server-side through Netlify Functions, so the API key is never shipped in the page.

## Web setup
The Netlify site needs a secret environment variable named `OPENAI_API_KEY`. Optional overrides are `MWG_WORDPACK_MODEL`, `MWG_TTS_MODEL`, and `MWG_TTS_VOICE`. See `docs/WORD_PACK_V0149.md`.

## Local / Chromebook fallback
`Miori_Word_Garden_v0149_Standalone.html` still runs as the local spelling game. The new PDF-to-Word-Pack generation needs the deployed web backend; all existing offline learning features still work.
