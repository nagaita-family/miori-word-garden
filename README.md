# Miori's Word Garden — v0.14.9 Web Word Pack

Miori's spelling-learning game. v0.14.9 adds the Web Word Pack workflow while keeping the v0.14.1 functional learning design as the baseline.

## v0.14.9
- Parent can upload a school spelling PDF in the web version.
- The server creates a Word Pack with school English meaning, Japanese meaning, a child-friendly example sentence, phonics focus, picture cue, and natural audio.
- Four audio types are supported: normal word, slow Hint word, English meaning, and example sentence.
- Generated audio is stored locally in the browser (IndexedDB).
- OpenAI API calls run through Netlify Functions, so the API key is not shipped in the page.

## Netlify
Required secret environment variable: `OPENAI_API_KEY`.

Optional overrides:
- `MWG_WORDPACK_MODEL`
- `MWG_TTS_MODEL`
- `MWG_TTS_VOICE`

Current release source package: v0.14.9.
