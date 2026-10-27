# School Word Pack — GitHub delivery

**For weekly updates, change only [current.json](current.json).** GitHub Pages publishes it when the change reaches `main`. Miori opens the Word Garden, and This Week updates automatically without selecting a downloaded file.

## Data ownership

- **GitHub / current.json:** school week ID/title, the 10 target spellings (preserve capitalization), English definitions exactly as supplied by school, phonics-informed `chunks`, optional obvious `seedFocus`, and one original concept illustration `image` path per word.
- **iPad / localStorage:** practice results and recall dates, learning history, ⭐ priority, Parent manual Focus, Journal/reading My Words and notes, and Garden progress.
- **IDs:** lowercase normalized spelling prevents duplicates across This Week and My Words. `displayWord` keeps the exact Word Pack spelling, including names and weekdays.

## Publishing next week's words

1. Read the school sheet and verify each target spelling and English definition. Do not guess unclear source text.
2. For each new word, use ChatGPT to create an original child-friendly **picture of the meaning** (an action, situation, or object). The picture must have **no word, label, letters, translation, or Japanese text**. For abstract words, choose a clear little scene. Save ten small assets in `word-images/` (SVG, PNG, or WebP).
3. Replace `current.json` with a Word Pack object containing a **new stable `weekId`**, a `weekName`, and its `words` array. Add `image: "./word-images/example.svg"` for each word (the path must correspond to a committed asset). Include `chunks` when reviewed. Leave `seedFocus` null unless there is an obvious tricky part.
4. Commit/push to `main`; wait for successful GitHub Pages deployment. The app fetches `./word-packs/current.json` on opening and when returning to Play/Parent.
5. Existing iPad progress survives. The previous This Week becomes Past Tests, and My Words are never mixed into This Week practice.

A new `weekId` means a new school test. Correcting a definition or Chunk **with the same `weekId`** updates curriculum metadata but does not reset a current test draft or Parent's week Focus list.

## Offline and exceptional situations

- If the network is unavailable, the app keeps the last saved This Week and My Words. No error wipes local data.
- **Manual Import (backup)** remains available in Parent. An emergency manual pack is protected from the current remote pack until GitHub publishes a different `weekId`.
- Export/Restore Backup continues to include all learning data. GitHub does not receive private learning history.
- If a word is both This Week and My Words, it exists once in the library. My Words notes and local explanation remain untouched. This Week's school definition is retained separately in `week.schoolMeaningById`.

## Maintenance

Validation rejects malformed data, repeated spellings, mismatched Chunk strings, and out-of-range seed Focus **before modifying the current week**. The app only writes local storage when the published pack changes. Don't add weekly vocabulary hardcoded to `app.js`; the existing legacy seed list is retained only for older local/offline compatibility.

## Picture-led meaning learning (v68)

The learner sees **the same picture** throughout Look & Listen, guided writing, hidden spelling recall, and the paper Practice Pad. The picture communicates meaning without revealing the spelling; a small **Show English meaning** control is optional. No Japanese meaning is rendered in Five Words, even when the curriculum still contains `meaningJa` metadata for other uses. Picture recall is **not separately graded** or a new gate for Garden rewards.

New images are generated **when the parent provides the new school word list to ChatGPT**, then committed alongside `current.json`. There is no image-generation API key in the public iPad client, no runtime image generation, and no new backend. Avoid hardcoding weekly pictures in application JavaScript.

Safe asset references are local to this website: `./word-images/<lowercase-id>.svg|.png|.webp`. Older packs and locally added My Words without an image still work with a neutral visual placeholder, not a fabricated picture. When a word belongs to both This Week and My Words, the school picture is stored in the week-specific `schoolImageById`, while a personal image, if any, stays on its original My Words record.
