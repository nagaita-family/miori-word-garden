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

Verification/deployment checkpoint: full regression 37/37 on the initial C.6 implementation; targeted Garden suite 19/19 after the visual and drag fixes. Browser QA on the published desktop Garden confirmed v44 assets, only Tree/House and Bunny/Bird at 0 XP, smaller landmark proportions, Bunny drag into House, visible reaction/return control, and Tree position surviving reload. The item drag preserves the pointer's grab offset; a targeted pointer test covers this. An invisible disabled fruit button intercepted grabs on part of the Tree, so disabled fruit now ignores pointer input. Final production QA confirmed the v44 `c6c` script and `c6d` stylesheet, Tree drag from the former fruit overlay and persistence after reload, and Bunny drop onto Tree with an on-screen reaction. The seven XP items and Cat were checked through state/render/reaction tests, not an earned-content browser session. Actual iPad Safari / Pencil and narrow viewport remain device checks. Initial C.6 run 35965622110, visual fix 35966851519, pointer-offset run 35967082707 and disabled-fruit run 35967235641 all deployed successfully. Final code commit: `1ec7cf75ef3e8fccea9d679d7d63123d8d3c2b2a`.

## Phase D.0 — Motion & Reaction Foundation, v45, 2026-09-24

**Completed:** Character artwork stays unchanged. The existing Bunny, Cat and Bird SVGs breathe/sway by 1–2 px inside stationary pointer targets; Cat/Bird have staggered timing. Their common sit/perch/play hop, eat/drink/bathe nod, inspect tilt, Arch exit hop, item response and three brief non-interactive sparkles make drop reactions visible before short explanatory text. Reactions end in idle or a calm sitting pose. User grabbing a character cancels pending reactions; roaming keeps its prior short easing and yields to user commands. Reduced-motion mode disables continuous/transient animations. The Arch remains XP630, stored until earned, movable and storable; passage now starts on the near side, moves behind its frame while shrinking, then leaves on the far side. No new assets, migration, or learning changes.

**Item Matrix update:** All 9 C.6 items keep their original unlock, storage and movement rules. Bench → hop/sit; Picnic → nod/eat; Mailbox/Shed → tilt/inspect; Bird Bath → Bird splash or other resident sip; Seed Crate → play/perch/inspect; Flower Arch → near/through/far passage or Bird perch; Tree → inspect or ripe fruit eat; Main House → current entrance and return UI (door/occupancy is D.2). Every outdoor reaction uses the same small response effect; stored or locked items still cannot react.

**Character Matrix update:** Bunny, Cat (XP360) and Bird each have whole-body idle motion and representative reactions. All retain direct Drag & Drop, saved positions and location gating. No separate ear/tail/eye/wing layers were needed or made. Counts remain **9 items / 3 characters**; remaining targets are approximately 1 item / 3 characters.

**Tests and publication:** `node --check living-garden.js`; relevant D.0, C.6 and Phase B tests pass; one major regression run passed 41/41 (Garden, Play, Weekly, Parent). Implementation commit `2509dc6e2823e4b0504b32e10477bc0f07f4060d` on main; GitHub Pages run `35970156020` completed successfully. Live desktop browser loaded v45 and D.0 JS/CSS. Bunny and Bird each showed `reacting` motion, item response and a short sparkle on a Tree drop, then returned to `livingBreathe` idle. Existing illustration SVGs remain intact. The Arch depth motion and earned Cat/item cases passed targeted tests; a high-XP browser session was not used. Actual iPad Safari/Pencil, touch hit areas, reduced-motion device setting and narrow viewport remain unverified on a physical device.

**Current:** main; D.0 completed and published. **Next:** D.1 Garden Garage, then D.2 House occupancy/door, D.3 Look Inside, D.4 Friend Houses. Garage still uses the C.6 shelf as interim storage; existing House location and return control remain, with no indoor scene. No D.1–D.4 work begun in this checkpoint.

## Phase D.1 — Garden Garage, v46, 2026-09-24

**Completed:** A small illustrated backyard Garage is physically in the Garden scene. Tap it to open its light inventory inside that scene. Only XP-owned items appear; owned unplaced items read “In Garage” and can be placed, while placed items read “In Garden” and can be put away. A placed item can also be tapped for “Put in Garage.” The C.6 external shelf has been removed. Reuse `garden.placed`, `garden.itemPos`, unlock thresholds and existing item reactions; there is no new migration, learning change or external management screen. Storing a targeted item cancels its pending character reaction. Garage is a fixed facility, not an additional playable/XP item; Tree and Main House remain permanent movable scenery.

**Item Matrix update:** Bench 90 XP, Picnic 180, Mailbox 270, Bird Bath 450, Seed Crate 540, Flower Arch 630 and Shed 720 all follow locked (hidden everywhere) → unlocked/stored in Garage → placed/movable/reactive in Garden → back to Garage. Positions persist when stored. Tree and Main House remain always placed. **9 playable items** still; target gap approximately 1. Flower Arch remains the same small movable/storable item, with the D.0 depth reaction only while placed.

**Character Matrix update:** Bunny and Bird start, Cat unlocks at 360 XP; all 3 still drag and react to placed items only. Garage does not change character location or their D.0 idle/reaction motion. Target gap approximately 3 characters.

**Tests and publication:** D.1 tests cover hidden locked items, stored → placed → stored, position persistence, stored reaction rejection, canceling an active reaction and retaining learning data. Targeted Garden tests 19/19; one Garden/Play/Weekly/Parent regression run 44/44; `node --check living-garden.js` and `git diff --check` passed. Implementation commit `3e4b560850daf13e9d143390845b677d32a7226d` deployed in Pages run `35977316513` (success); Garage visibility/layout refinement commit `a8470c40da3b644867b521f9482a232106ccaab1` deployed in run `35977514181` (success). Production desktop browser loaded v46 with the D.1b stylesheet, showed the small Garage and opened its scene-contained inventory; at 0 XP the inventory held no locked items. Panel Place/Put away behavior with earned items was tested through the render/state fixture, not a high-XP browser session. iPad Safari/Pencil and narrow viewport remain real-device checks.

**Current:** main, D.1 completed and published. **Next:** D.2 Main House & Character Location; D.3 Look Inside and D.4 Friend Houses unstarted. Existing House location and return controls remain the C.6 baseline; no door/occupancy/interior implementation has begun.

## Phase D.2 — Main House & Character Location, v47, 2026-09-24

**Completed:** Drop a Garden character onto Main House to approach its door, open it, shrink toward the doorway, pass behind the facade, then save `location = main_house` and show that character's face above the house. House tap lists the current occupants with individual “come outside” controls and an “Everyone come outside” control when more than one is inside. Returning opens the door, shows the chosen character emerging small from the threshold, then moves it out into the Garden; the group action sequences exits. The original `garden` / `main_house` location values, character positions and XP gating remain; no migration or learning changes. Indoor residents stay absent from the Garden and cannot react to outdoor items. The House itself remains movable. Its facial occupancy badge is intentionally part of the exterior, while the room view belongs to D.3.

**Item Matrix update:** Main House now animates door/occupancy as its existing start item. The 7 Garage treasures, Fruit Tree and Flower Arch retain all D.1 unlock, placement, storage, movement and character Drop rules. **9 playable items**; target gap about 1.

**Character Matrix update:** Bunny and Bird start; Cat remains XP360. All 3 may be at `garden` or `main_house`, with direct Drag & Drop entry, one-at-a-time or group return, persistent locations, visible door motion and existing D.0 idle/reactions outside. **3 characters**; target gap about 3. `friend_house_x` locations, interiors and special residents await D.4/D.3.

**Tests and publication:** D.2 tests cover timed entry/exit and door classes, occupancy faces, chosen and group exits, location persistence, indoor interaction blocking, unchanged learning and reduced-motion styling. Targeted D.2/B/D.0/D.1 tests 16/16; major Garden/Play/Weekly/Parent regression 47/47; `node --check living-garden.js` and `git diff --check` passed. Implementation commit `9a4a64f4c9d9e8bda907db928a598a916d3e7d2c` deployed successfully in GitHub Pages run `35978810767`. Live production v47 browser QA dragged Bunny to the House and observed the opened door and approach, then a saved occupancy face and `1 inside` after entry. Reload preserved occupancy; the House offered Bunny come outside, opened the door, showed Bunny emerging, and returned to `0 inside`. Group exit is covered in tests, not a live multi-resident browser session. Actual iPad Safari/Pencil and narrow viewport remain device checks.

**Current:** main, D.2 completed and published. **Next:** D.3 Look Inside / single dollhouse room, then D.4 Friend Houses. No interior room or friend cottage has begun.

## Phase D.3 — Look Inside / Dollhouse View, v48, 2026-09-24

**Completed:** Tap Main House → Look Inside to open one cozy room over the Garden. The existing Bunny/Cat/Bird artwork appears only for characters whose saved location is `main_house` and whose unlock condition is met. Bunny sits by the sofa, Cat by a cushion, Bird near the window; the shared whole-character idle animation gently bobs, sways and breathes, with reduced-motion support. An empty House shows an invitation to bring someone home. Back to Garden closes the room. A resident's Come outside closes the room first, then reuses the D.2 visible door opening and emerging transition in the Garden. No new persistent state or migration, interior movement, furniture editing, room engine or new asset set.

**Tests and publication:** D.3 cases verify location-filtered residents, locked Cat, persistent location after reload, room closing and selected exit through the existing door, reused art and reduced motion. Targeted D.0–D.3 checks 12/12; full Garden/Play/Weekly/Parent suite 50/50; `node --check living-garden.js` and `git diff --check` passed. Implementation commit `10de43089f7d097bf6846b3ed33d2df94499e0dd` deployed successfully in GitHub Pages run `35979778792`. Production desktop browser loaded v48, dragged Bunny into Main House, opened Look Inside and saw Bunny alone in the room, then chose Come outside and observed the room close, the door open, and Bunny emerge. Physical iPad Safari/Pencil and narrow viewport remain device checks.

**Current:** D.3 completed and published on main. **Next:** D.4 Friend Houses; D.3 has one room for Main House only. Keep the existing exterior item movement, Garden Drag & Drop, learning data and Garage intact. This Work container's local `main` checkout still points to `c157307` and holds the published D.2–D.3 file contents as uncommitted changes because direct git fetch to GitHub timed out; these are not discarded work. Before future edits, reconcile against the GitHub main HEAD using the connector or a working fetch, preserving local edits. The GitHub main and this HANDOFF are authoritative.

## D.3b — Move characters inside Main House, v49, 2026-09-24

**Completed:** Residents in Look Inside can be dragged within the single room using touch/Pencil or mouse, and moved in 5% increments with arrow keys while focused. Only the character artwork is the drag handle, leaving Come outside available. Positions are kept in `garden.roomPos` by resident and persist across room closing/reopening and save reload; existing Garden positions and learning data are unchanged. The room bounds keep residents visible. No furniture placement or room engine.

**Validation and publication:** D.3b state test checks saved, bounded independent room positions and locked/outside residents; D.2 and D.3 targeted tests 7/7, full regression 51/51, syntax and whitespace checks passed. Commit `0175bd777d9d612b2529185b12a7ceaed0a3e59f`, Pages run `35981889953` succeeded. Production v49 browser moved Bunny across the room and confirmed the exact position survived a reload.

**Current:** D.3b completed and published. **Next:** D.4 Friend Houses, in its own complete release. Current local checkout remains behind remote main as noted above; preserve all uncommitted published code while reconciling.

## Phase D.4 — Friend Houses, v50, 2026-09-24

**Completed:** Bird Nest House is visible from the start; Cat Cottage appears only with Cat at XP360. Both are small, movable Garden cottages with their own material, roof, window, greenery and warm details. They are permanent Garden scenery, never Garage inventory. Any unlocked outdoor resident can be dropped onto either cottage, enter its opening door, and persist a distinct `bird_house` / `cat_house` location. Each cottage shows its own occupant faces and offers selected or group Come outside; the D.2 door exit is reused. Residents indoors cannot react to Garden items. Main House's room still shows only `main_house` residents. No new characters, dedicated cottage rooms, learning changes or additional artwork files.

**Item / Character Matrix:** Existing 9 playable C.6 items retain their unlock, placement/storage, movement, reaction and visual scale; Bird Nest House and Cat Cottage add 2 movable permanent character destinations (not Garage or XP items). Main House and Tree remain permanent; Flower Arch remains an ordinary movable earned item. Bunny and Bird remain starter residents; Cat unlocks at XP360. All 3 characters can be outside or inside any available house, and the 3 house locations remain independent. Playable item target gap remains about 1; character target gap remains about 3. More residents and bespoke cottage interiors are future content.

**Validation and publication:** D.4 tests cover house unlock visibility, permanent movement, location persistence, indoor Garden reaction block, individual and group door exit, separate house occupancy and Main House room filtering. D.4 targeted 4/4 and full Garden/Play/Weekly/Parent regression 55/55; syntax and whitespace checks passed. Implementation commit `ce569f3c3e75490c28b8971274af8eeed51640d7` deployed in successful Pages run `35982363513`. Production desktop browser loaded v50, saw the Bird Nest House and locked Cat Cottage hidden at 0 XP, dragged Bird into its cottage, reloaded to confirm its own occupant face and location, then selected Bird come outside and observed the door exit. The unlocked Cat Cottage visual and group action were covered by tests, not a high-XP browser session. iPad Safari/Pencil and narrow viewport require actual device verification.

**Current:** D.4 completed and published. Next phase should be chosen after user feedback. Local checkout still has uncommitted published snapshots because GitHub git fetch timed out; GitHub main is authoritative and local work must be preserved.
