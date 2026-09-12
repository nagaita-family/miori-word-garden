# v0.14.9 — Web Word Pack (Phase 1 + Phase 2)

## Goal
Parent uploads the school's spelling PDF inside Word Garden. The server extracts the school word list and school English meanings, generates Japanese meanings, one simple example sentence, a phonics focus and a picture cue, then generates four high-quality audio variants where applicable.

## School-source rule
`meaningEn` is source-preserving: if the PDF contains an English definition, keep that wording faithful. Do not silently rewrite the school's wording. AI-generated fields are `meaningJa`, `example`, `phonicsFocus`, and `pictureCue`.

## Audio variants
- `word`: natural word pronunciation
- `slow`: careful, slower word pronunciation for Hint
- `meaning`: English meaning audio
- `example`: example-sentence audio

The audio is created with OpenAI TTS and is explicitly disclosed in the UI as AI-generated. Audio blobs are stored in the browser's IndexedDB; progress and word data continue to use the existing local game state. This version intentionally does not add accounts or cross-device cloud progress.

## Web backend
Netlify Functions:
- `/api/wordpack`
- `/api/audio`

Required Netlify secret:
- `OPENAI_API_KEY`

Optional environment variables:
- `MWG_WORDPACK_MODEL` (default `gpt-5.6-luna`)
- `MWG_TTS_MODEL` (default `gpt-4o-mini-tts`)
- `MWG_TTS_VOICE` (default `coral`)

## Local fallback
The game still works as a local/offline spelling game. The PDF-generation card needs the web backend. Existing manual `word | English meaning` import and browser speech synthesis remain as fallback paths.
