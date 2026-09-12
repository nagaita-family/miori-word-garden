# Adaptive Spelling Practice — v0.14.2

Functional baseline: v0.14.1.

## Goal
Make Step 2 and Step 3 practice the part of each word that Miori actually finds difficult, without allowing mistakes in one word to affect another word.

## Target priority
For each word independently:

1. **Parent: Miori's spelling**
   - If the field contains a spelling that differs from the correct word, its difference is the Step 2 / Step 3 target.
   - Example: `sturdy` / `sterby` -> target `urd` (`st___y`).
2. **Adaptive gameplay profile**
   - Used when Miori's spelling is blank or already correct.
   - Built only from that word's actual Step 3 / Step 4 spelling mistakes.
3. **Existing v0.14.1 fallback**
   - Phonics focus when available, otherwise the normal generated gap.

## Per-word profile
Stored under that word's own `state.stats[wordId].adaptive` record.

Each correct-character position tracks:
- difficulty score
- number of wrong attempts
- number of first-try correct attempts
- most recent wrong character when available

Profiles are not shared across words or across similar letter patterns.

## Difficulty update
- Wrong Step 3 / Step 4 attempt: affected positions gain **+2** difficulty (maximum 12).
- First-try correct Step 3: positions in that gap lose **1** difficulty.
- First-try correct Step 4: difficult positions across the whole word lose **1** difficulty.
- A correct retry after a wrong attempt does **not** reduce difficulty; the goal is to reward first-try recall.

This means one mistake normally needs about two future first-try successes to fade back to zero.

## Difference detection
The app aligns the expected and typed spelling, so it can detect:
- replacement (`silent` -> `silant`)
- missing letter (`butterfly` -> `buterfly`)
- extra letter (`beautiful` -> `beautifull`)
- multiple separated errors

## Gap selection
When adaptive history is used:
- choose the highest-difficulty position for that word
- make a small 2–4 letter chunk around it when possible
- use the last wrong character as a Step 2 distractor when that is meaningful

## Reset behavior
Word Library > **Reset learning** clears the adaptive profile for that word together with its other learning statistics. Garden state is not affected.

## Non-goals in v0.14.2
- Quick Review and Weekly Challenge mistakes do not train the adaptive gap profile.
- There is no cross-word phonics model.
- Parent Miori's spelling is not automatically overwritten by gameplay.
