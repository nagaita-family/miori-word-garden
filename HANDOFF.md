# Miori Word Garden implementation handoff

## v36 — September 23, 2026

Starting main: d48f1f72c1a687456e392842e2f93abc65166927.

Reported on iPad + Apple Pencil: in Stage 3 dotted tracing cells, writing the next letter before the first letter is recognized can lose the next input. The actual iPad event sequence has not been captured; the precise platform cause remains unconfirmed.

The targeted first improvement retains one native input per tracing cell for the lifetime of the current rendered question. Correct recognition adds a pointer-transparent display overlay instead of replacing the input. Composition is guarded using both composition events and isComposing; candidate text is not cleared during recognition. Delayed results update their original cell without moving focus. Wrong attempts remain until a new stroke; explicit erasing clears only the selected cell and suppresses late results until writing resumes. Finger/palm events in this handler no longer blur pending recognition. Detached fields and previous questions ignore late results.

Scope: only bindTraceBox behavior, app cache query, release badge, release assertions, and regression coverage. Stage 3 gap input, Stage 4 whole-word input, scoring, audio, Garden, persistence and test mode are unchanged. A subsequent full question render continues to show completed traces as display elements.

Validation: node --check app.js; node --test tests/*.test.cjs — 19 passing checks (14 existing test files plus 5 new behavioral cases in trace-continuity-v36.test.cjs). New tests simulate overlapping compositions, late events, incorrect candidates/retry, palm contact, obsolete questions, and isolated erasing. These simulate browser events, not Apple's Scribble engine.

Required device follow-up: Parent Test Mode on iPad Safari + Apple Pencil; trace several adjacent dotted cells without waiting for converted text, including letters with multiple strokes. Check missing/duplicated letters, retry, Eraser, palm contact, and controls. Improvement on actual iPad is not yet verified. If input loss persists, capture event timing before choosing a larger input architecture change.

Deployment: main push uses .github/workflows/pages.yml; verify the release commit's run and production v36 after pushing. The Pages workflow does not run the regression suite. Production: https://family.nagaita.jp/miori-word-garden/ . DEPLOYMENT.md still contains the historical old URL; do not use it as the current production target.

## v37 — September 23, 2026, iPad video follow-up

The user supplied a 16.9-second video of Stage 3 tracing `butterfly` after v36. Multiple letters visibly received Pencil strokes but reverted to untraced cells; v36 did not resolve the practical symptom. Stage 3's dotted known letters now use per-cell SVG ink with Pencil pointer events, and a real stroke of at least 5 SVG units marks that known letter traced on pointerup. No iPadOS text recognition is needed for known letters; the missing chunk and full spelling continue to use native Scribble input and spelling assessment. Each cell retains its own ink and accepts multiple strokes. Explicit Eraser clears only the selected traced cell. Finger/palm touches and mere taps cannot mark completion. A cancelled gesture or stale question does not mark completion. q.tracePaths persists strokes across rerenders of the current question; q.traceLetters remains the traced-marker state. The actual school-word spelling remains checked in the gap field, not by the traced visible letters.

Validation: node --check app.js and pencil-touch-guard.js; node --test tests/*.test.cjs, 18 checks passing, including four new pointer-event behavior tests. Earlier v36 Scribble-specific tests were replaced because the known-letter tracing mechanism changed. Confirm on actual iPad that fast `butterfly` tracing stays visible and each cell turns green, including multi-stroke `t` and `f`, then test Eraser, the blank input, and stage transitions. Production URL and Pages workflow unchanged.

## v38 — September 23, 2026, tracing feedback clarity

The user confirmed v37 tracing felt substantially faster, but any drawn letter was shown with a green check even when it was the wrong character. The trace of a visible guide is a handwriting warm-up; its ink is not character recognition. v38 removes the green check and uses a gentle lilac border/background and purple ink to show that a stroke was captured, without claiming correct spelling. The missing-letter gap and Stage 4 remain the places where spelling is checked. Only the trace CSS, CSS cache key, visible release badge, and matching test expectations changed.

## Living Garden Phase A — v39, 2026-09-24

Completed: fresh versioned Garden subtree (`livingGardenVersion:1`) with idempotent migration on load, local-time Morning/Day/Evening/Night landscape, trees/shrubs instead of fence, two slow CSS clouds and reduced-motion support. New `living-garden.js` and `living-garden.css` are loaded before/after app styles respectively; the existing learning flow and Pencil code remain in `app.js`. The Garden renderer delegates to LivingGarden. Legacy Garden helpers remain unused by this new view for now, minimizing changes to mature learning code.

Data protection: only `state.garden` is replaced once. Top-level XP, stats, week/myWords/pastWeeks, lib and learning history, weekly test results, settings and Test Mode routing are retained. Parent's Garden-only reset now calls fresh() without resetting XP. `localStorage.clear()` is not used. Backup restore runs loadState migration if the restored backup predates Living Garden.

Phase status: A completed. B/C/D not started. Old Treasure unlocks are suppressed for the new Garden, while XP still increments as before for learning. The new Garden's growth count continues on full Stage 4 completion; Phase C will give it visible fruit. Garage and houses are only state placeholders until Phase D.

Verification: node --check app.js/living-garden.js, `node --test tests/*.test.cjs` 22 passing checks including migration, time classification, and environment. GitHub Pages success and production URL verification must be recorded after push. Local browser screenshot was unavailable because the installed Playwright package had no browser executable. iPad Safari/PWA dayparts, cloud speed, responsive layout and actual Pencil flow remain unverified on device.

Next: Phase B character location / explicit actions and gentle autonomous behavior, Flower Arch reaction. Then Phase C fruit and time-of-day moments. Keep each phase self-contained, version/cache updated, tests + successful deployment before continuing. Phase D not yet started.

## Living Garden Phase B — v40, 2026-09-24

Completed: Bunny, Cat, and Bird each have persistent `garden` / `main_house` locations and Garden positions. A v39 garden gains missing residents in place without resetting existing growth or a chosen Bunny location. The characters rest or wander gently on a 9.5-second tick only while the Garden view is active. Explicit commands set a 20-second preference over autonomous movement. Tapping a friend offers Visit Arch / Go Home; tapping the Flower Arch invites a friend; the house shows an indoor count and offers Come Outside. House residents are absent from Garden interaction. Flower Arch has a shared object reaction lookup keyed by object and character, ready for future object reactions. The house is a simple destination at this phase; detailed door and interior interactions remain Phase D.

Data: Garden-only `locations`, `characterPos`, `commands`, `placed` persist through the existing localStorage save and backup. Learning, weekly test, XP and Pencil code remain untouched. `placed:['arch']` introduces the Flower Arch in this fresh Garden; Garage/storage work remains Phase D.

Verification: targeted Phase A/B tests and full Node suite: 26 passing checks. No iPad Safari/PWA visual or Pencil device verification. Deployment/job/production status to be confirmed after push. Phase A/B complete; C and D not started. Next touch `living-garden.js` + `living-garden.css` for fruit and daypart moments, and the single Stage 4 completion branch in `app.js` for the event hook.

## Living Garden Phase C — v41, 2026-09-24

Completed: the existing successful Stage 4 word completion now calls `LivingGarden.onWordComplete` exactly once, after the existing Garden growth and XP update. Four visible fruit stages (flower, tiny fruit, growing fruit, ripe fruit) appear on the new Garden tree. A ripe fruit can be tapped; a friend still in the Garden moves toward the tree and reacts, then one fruit is eaten. If multiple words were completed before eating, progress beyond the first ripe fruit remains for the next fruit. This is optional and has no missed-fruit penalty. Fruit state persists under `garden.fruit` and upgrades from Phase A/B growth once if needed.

The first successful word in each local daypart each day shows a short Morning/Day/Evening/Night message. This is presentation only: no streak, no required time slots, no extra XP or fruit increment. Weekly Test grading never calls this hook. User-controlled character commands remain higher priority than wandering, and house residents are excluded from fruit eating.

Verification: `node --check app.js living-garden.js` (individually), targeted Phase A/B/C and full `node --test tests/*.test.cjs`: 29 passing checks. Phase A, B and C complete, Phase D not started. Confirm GitHub Pages run success and production v41 after push. iPad Safari/Pencil, layout, time changes, fruit tapping and animation remain device checks, not verified by Node tests.

Next session: inspect this latest main and HANDOFF first. Phase D may implement Garage, houses, occupancy and Look Inside separately after device feedback. Do not migrate old Treasure contents or reset any top-level learning data. Existing `state.garden` is the only fresh Living Garden subtree; `state.xp` remains learning-linked.

### Published phase checkpoints (2026-09-24)

- Phase A: `4a70ada48d83e12eb57602463c64607d2b9fc5ce`, Pages run `35947715677` completed/success; production displayed v39.
- Phase B: `74f298a26a0e1bafdbd766db07b4836b2d4f6bb5`, Pages run `35947985519` completed/success; production displayed v40.
- Phase C: `698583d3212cfdd1f28f3957c0840e587f21e15c`, Pages run `35948181024` completed/success; production displayed v41 and served the matching `living-garden.js` asset.

All three phases are complete and published; Phase D is untouched. Browser visual preview and iPad Safari/Pencil interaction are still unverified. The installed Playwright package had no browser executable in this workspace; no visual QA claim is made. When resuming, confirm production main and check the Garden on iPad before starting Phase D.

## Living Garden layout and interaction fix — v42, 2026-09-24

The user reported that all characters clustered at the upper-left, could not be moved, and cloud movement was imperceptible. Cause: `#livingActors` was an absolutely positioned direct child of `.living-scene` with no bounds; its children used percentage positions relative to that collapsed layer. It now fills the scene (`inset:0`) and allows pointer interaction only on the actor buttons. Pointer drag with mouse, touch or Apple Pencil places an actor within scene bounds, saves its Garden position, and overrides wandering for 20 seconds. A tap still opens its arch/house menu. Clouds now traverse 190px over 38/52 seconds, with reduced-motion animation disabled.

Verification: `node --check living-garden.js`, `git diff --check`, full Node suite 30 passing checks including bounded placement and actor-layer coverage. Production run and iPad Safari/Pencil visual verification remain to be recorded after publication. Learning state, Stage 3 writing, XP and weekly test remain untouched. Phase D has not started.
