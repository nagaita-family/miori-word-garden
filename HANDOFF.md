# Miori Word Garden implementation handoff

## v36 — September 23, 2026

Starting main: d48f1f72c1a687456e392842e2f93abc65166927.

Reported on iPad + Apple Pencil: in Stage 3 dotted tracing cells, writing the next letter before the first letter is recognized can lose the next input. The actual iPad event sequence has not been captured; the precise platform cause remains unconfirmed.

The targeted first improvement retains one native input per tracing cell for the lifetime of the current rendered question. Correct recognition adds a pointer-transparent display overlay instead of replacing the input. Composition is guarded using both composition events and isComposing; candidate text is not cleared during recognition. Delayed results update their original cell without moving focus. Wrong attempts remain until a new stroke; explicit erasing clears only the selected cell and suppresses late results until writing resumes. Finger/palm events in this handler no longer blur pending recognition. Detached fields and previous questions ignore late results.

Scope: only bindTraceBox behavior, app cache query, release badge, release assertions, and regression coverage. Stage 3 gap input, Stage 4 whole-word input, scoring, audio, Garden, persistence and test mode are unchanged. A subsequent full question render continues to show completed traces as display elements.

Validation: node --check app.js; node --test tests/*.test.cjs — 19 passing checks (14 existing test files plus 5 new behavioral cases in trace-continuity-v36.test.cjs). New tests simulate overlapping compositions, late events, incorrect candidates/retry, palm contact, obsolete questions, and isolated erasing. These simulate browser events, not Apple's Scribble engine.

Required device follow-up: Parent Test Mode on iPad Safari + Apple Pencil; trace several adjacent dotted cells without waiting for converted text, including letters with multiple strokes. Check missing/duplicated letters, retry, Eraser, palm contact, and controls. Improvement on actual iPad is not yet verified. If input loss persists, capture event timing before choosing a larger input architecture change.

Deployment: main push uses .github/workflows/pages.yml; verify the release commit's run and production v36 after pushing. The Pages workflow does not run the regression suite. Production: https://family.nagaita.jp/miori-word-garden/ . DEPLOYMENT.md still contains the historical old URL; do not use it as the current production target.
