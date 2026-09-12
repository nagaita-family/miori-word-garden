# Miori's Word Garden — Garden UX / Reward Specification v0.13.1

## Goal
Make each completed learning action feel like it visibly changes or celebrates the Garden, without turning the app into a points dashboard.

## Garden object rules
### Draggable
- initial Bunny
- every Weekly Challenge Animal Friend
- every Weekly Challenge Special Garden Item

Drag-and-drop position persists in saved Garden data. Dragging has no effect on learning history.

### Fixed / rooted
- growable flowers
- vegetable plots and vegetables
- Seed House
- fountain / terrain / background scenery
- Weekly Challenge sign

## Focus Words and Encore: Watering reward
After each completed word:
1. return to Garden;
2. show a clear “Word complete / Water time” celebration;
3. animal performs watering sequence;
4. vegetable growth takes priority if a planted vegetable is unfinished; otherwise a flower grows;
5. play layered water + growth + success sound;
6. show a short final growth burst.

This reward scene should feel noticeably more exciting than an ordinary button press but should finish quickly enough to keep practice moving.

## Quick Review: Seed reward
After all three Quick Review words:
1. award exactly one vegetable seed for the practice run;
2. route to Garden;
3. show a prominent “Seed earned!” overlay;
4. animate the seed toward the Seed House;
5. pulse/highlight the Seed House;
6. play a distinct seed-reward sound;
7. leave Bonus Sun available immediately afterward.

## Bonus Sun
After completing the My Word requirement:
1. route to Garden;
2. brighten the entire Garden with warm sunshine;
3. animals celebrate;
4. use a stronger sunshine sound and temporary particles;
5. normal growth stages do **not** advance;
6. existing ~20% Special Flower transformation remains a surprise bonus.

## Weekly Challenge
### Clear
- clear means challenge completed with one or more mistakes;
- show a large “Challenge Clear!” celebration;
- use green/blue confetti and a richer fanfare than ordinary practice;
- create one mystery Present Box.

### Perfect
- perfect means all answers correct first try;
- prize value is the same as Clear;
- show a larger “PERFECT!” celebration with gold/pink light, more confetti and a more elaborate fanfare;
- create one mystery Present Box.

## Mystery Present Box
Every completed Weekly Challenge attempt creates one new Present Box.

On tap:
1. box glows/shakes and opening sound begins;
2. screen burst/particles appear;
3. reveal one random reward: Animal Friend **or** Special Garden Item;
4. reward appears in Garden;
5. show a large reveal card and fanfare;
6. tell player that the new friend/item can be dragged to a favorite place;
7. Garden navigation is immediately usable after reveal.

## Reward pool
### Animals
- Puppy
- Kitten
- Bluebird
- Squirrel
- Duckling
- Hedgehog

### Special items
- Tree House
- Bench
- Bird Cage
- Mailbox
- Garden Lantern
- Flower Arch

## Interaction quality
- Dragging should work with mouse, trackpad and touch through Pointer Events.
- Movable objects use a grab cursor / lifted shadow while dragging.
- Flowers and vegetables must not respond to dragging.
- Achievement overlays use `pointer-events: none` so they never block the learning route.
- All celebrations must preserve the current practice state and Garden save state.
