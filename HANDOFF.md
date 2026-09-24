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

Verification: `node --check living-garden.js`, `git diff --check`, full Node suite 30 passing checks including bounded placement and actor-layer coverage. Commit `dbc7865f7f1679cb2a14c9c36b56296ed80b3c3b`, Pages run `35949964340` completed/success with the deploy step successful; production responded HTTP 200 with v42 index and matching JS/CSS assets. iPad Safari/Pencil visual verification remains a device check. Learning state, Stage 3 writing, XP and weekly test remain untouched. Phase D has not started.

## Living Garden Phase C.5 — v43, 2026-09-24

Visual quality pass after observing v42 production: Flower Arch was only a 🌸 emoji on the path, much smaller than Bunny. Replace it with a large SVG trellis with two wooden/leafy supports, a continuous curved top, flowers along the frame, and a clear opening. The trellis renders in front of characters. Its SVG root cannot receive pointer input: only the painted frame receives Arch taps, so the center opening passes touch/Pencil through to characters. Bunny/Cat traverse from x55/y74 to x64/y74 through its opening; Bird perches at x63/y43. Keep the existing location/placed gates and reaction text. Tree foliage gains illustrated layers; flower/fruit and Bird use simple matching SVG art rather than emoji. No new Garden items, House or Garage logic, learning flow or Garden data migration.

Visual language for Phase D: small California garden cottages with rounded silhouette, tactile wood/plaster and warm windows; doors large enough to admit their resident, flowers/greenery scaled beside the doorway, and a subtle resident motif (Bunny in carved door trim/flower pots, Cat and Bird each with their own material/detail) rather than oversized ears or a generic emoji. Carry this same soft, warm, hand-drawn treatment to Garage and furnishings. The current Main House remains the Phase B placeholder; House interiors, occupancy and Garage are still Phase D work.

Verification: `node --check living-garden.js`, `git diff --check`, full Node suite 32/32 passing before final presentation-only refinement; targeted A/B/C plus Play/Weekly suite 15/15 passing after it. Phase C.5 latest implementation commit `2bfbe07c0216bb18349d36b7d573870caa374ffc`, Pages run `35957610012` completed/success. Live browser loaded v43 and fresh JS/CSS assets; the Flower Arch visibly has an open center, Bunny receives center taps, painted frame handles Arch taps, and the Bunny passage reaction appears. Browser inspection caught the SVG root consuming touches in the open center; only painted SVG paths now receive input. The visible plaque overlapped Bunny even when moved near the post, so remove it; the trellis remains a button with `aria-label="Visit Flower Arch"`. Actual iPad Safari/Pencil performance, small viewport and device touch behavior are not verified. Phase D remains untouched.

## Living Garden Phase C.6 — v44, 2026-09-24

Restore the miniature Garden play loop: pick up a resident, drag it onto any placed item, release and see the item's reaction. The seven previously drawn treasure SVGs in `app.js` now appear through the Living Garden shelf at their original XP thresholds; all start stored when unlocked, and each can be placed, moved and put away. The Fruit Tree and Main House are movable baseline pieces, but remain available as part of the landscape. Flower Arch is a small, movable XP630 item instead of the giant free starting structure. v1 Garden migration removes only that old unearned fixed arch, preserves character locations, positions, growth, fruit and all learning fields, and creates a fresh item-position map. Stored/locked objects never render or react. Cat follows its existing XP360 reward threshold; Bunny and Bird remain available at the start.

Shared reactions: sit, walkThrough, inspect, eat, drink, bathe, perch, play and enter. The same Garden drop path handles all placed items; Bird bath and the arch retain personality-specific reactions. Autonomous walking is background only; grabbing a character immediately cancels its current command. An empty-ground drop saves the chosen position. Tap House to let an indoor resident return to the Garden. House interiors and Garage remain Phase D.

### Item Matrix — 9 current / target about 10

All seven earned items share `locked` (XP below threshold) → `unlocked + stored` (shelf only) → `placed` (Garden only, draggable) → stored; XP is never spent. Stored items cannot react. The two baseline pieces are always placed and draggable, with no storage action.

| Item | Unlock / placement | Movable | Character drop | Visual / remaining work |
| --- | --- | --- | --- | --- |
| Cozy Garden Bench | 90 XP, starts stored | Yes | Sit / Bird perch | Existing rounded pink SVG; seat scale matches residents. |
| Strawberry Picnic | 180 XP, starts stored | Yes | Eat / Cat inspect | Existing blanket and strawberries SVG. |
| Heart Mailbox | 270 XP, starts stored | Yes | Inspect letter | Existing pink post and envelope SVG. |
| Bird Bath | 450 XP, starts stored | Yes | Bird bathe / others drink | Existing basin SVG; bowl reads as usable at miniature scale. |
| Seed Crate | 540 XP, starts stored | Yes | Play / Cat inspect / Bird perch | Existing wooden crate and seed packets SVG. |
| Flower Arch | 630 XP, starts stored; v1 free arch withdrawn | Yes | Walk through / Bird perch | C.5 floral trellis rescaled to resident size; its opening is the interaction space. |
| Little Garden Shed | 720 XP, starts stored | Yes | Inspect tools | Existing small cottage SVG; detailed building/interior remains Phase D. |
| Fruit Tree | Start, always placed | Yes | Inspect / eat ripe fruit | Compact rounded tree; growth and eating unchanged. |
| Main House | Start, always placed | Yes | Enter; tap to call back | Compact facade; entry feedback and return control; interior remains Phase D. |

### Character Matrix — 3 current / target about 6

| Character | Unlock / location | Draggable | Reactions and individuality | Remaining work |
| --- | --- | --- | --- | --- |
| Bunny | Start; Garden or Main House | Yes when outside | Sits, hops through arch, plays, eats | Phase D cottage/inside scene. |
| Cat | Original 360 XP; Garden or Main House | Yes when unlocked and outside | Sits, inspects, strolls through flowers, drinks | Phase D dedicated home/interior. |
| Bird | Start; Garden or Main House | Yes when outside | Perches, splashes, short gentle wander | Phase D nesting/home style. |

Future content gap: 1 more item and 3 more distinct residents to reach the approximate targets; do not add them just to fill counts. Phase D should extend the same drag-to-destination interaction to cottages, Garage and interiors, while retaining existing learning state and Garden placements.

Verification/deployment checkpoint: full regression 37/37 on the initial C.6 implementation; targeted Garden suite 19/19 after the visual and drag fixes. Browser QA on the published desktop Garden confirmed v44 assets, only Tree/House and Bunny/Bird at 0 XP, smaller landmark proportions, Bunny drag into House, visible reaction/return control, and moved Tree position surviving reload. The item drag now preserves the pointer's grab offset; a targeted pointer test covers this. The seven XP items and Cat were checked through state/render/reaction tests, not an earned-content browser session. Actual iPad Safari / Pencil and narrow viewport remain device checks. Initial C.6 run 35965622110 and visual fix run 35966851519 both deployed successfully. Final pointer-offset patch awaits its Pages check.
