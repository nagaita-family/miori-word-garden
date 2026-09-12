# v0.14.3 — Step 3/4 Support

Functional baseline: v0.14.2 (which itself branches from frozen v0.14.1).

## Goal
Reduce fatigue when Miori gets stuck while typing, before she is ready to press Check.

## Step 3 / Step 4 behavior
- Hint and Peek are visible from the start. There is no time-based trigger.
- Hint finds the earliest unresolved box, even when an earlier typed letter is wrong.
- Hint shows three letter choices. Choosing the correct one repairs that box and keeps the rest of the typed work.
- Peek shows the full correct word for 1.8 seconds, then hides it automatically. Existing typed letters stay in place.
- A wrong Check no longer sends Miori back a step and does not create Go back / Retry buttons. She stays on the same step and fixes the red letters.
- Quick Review and Weekly Challenge are unchanged.

## Adaptive learning
Each word remains completely independent.
- Wrong Check: existing v0.14.2 behavior (+2 to relevant positions).
- Hint: +1 to the relevant position, once per position per attempt.
- Peek: +1 to the relevant position, once per position per attempt.
- First-try decay applies only when no wrong answer, Hint, or Peek was used.

The Parent-supplied `Miori's spelling` still takes priority over the automatic Mistake Profile when it contains an actual mismatch.
