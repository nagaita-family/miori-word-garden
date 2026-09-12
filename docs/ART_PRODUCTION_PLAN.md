# v0.12 Art Production Plan

The final visual system is **asset-first**: the background contains scenery only; anything that grows, moves, eats, waters, or joins the garden is a separate transparent asset.

## Art direction
- Cozy premium miniature garden, soft high-detail 3D illustration.
- Warm morning daylight, gentle pastel palette, tactile wood/stone/leaves/water.
- 3/4 elevated isometric camera, consistent perspective across every asset.
- Friendly for an 8-year-old without looking babyish.
- No text baked into character/plant assets.
- Transparent background for interactive assets; soft contact shadow may be included only when it stays tight beneath the subject.

## Phase A — scenery-only master background
Target: 1536×960 (16:10), WebP/PNG.
Must include: central fountain, upper-left empty Seed House, right-side four-plot veggie patch, paths, fence, pond/stream, large tree / future tree-house area, open meadow planting spots.
Must NOT include: animals, growing flowers, vegetables, gift box, watering can, UI buttons, progress text.

## Phase B — first resident: rabbit
Generate from the same camera/light/style as the master background, transparent canvas, roughly square 768×768 source.
Required poses:
1. idle — cheerful neutral standing pose
2. water — holding a small watering can, facing slightly right/down
3. happy — small celebratory pose
4. eat — happily holding/eating a vegetable

Art consistency matters more than animation. CSS will provide small movement between high-quality still poses.

## Phase C — flowers
One coherent flower family first, then variants.
Stages: sprout → leaves → bud → bloom → special bloom.
Each stage should occupy the same visual footprint and camera angle so swapping images feels like growth rather than teleportation.

## Phase D — vegetables
Carrot, tomato, pumpkin first.
Stages: seed → sprout → growing → ready.
Transparent 512–768 px source assets, consistent soil contact and perspective.

## Phase E — weekly friends
Squirrel, cat, duck, hedgehog, bluebird. Each begins with a high-quality idle pose; water/happy/eat variants are added only where gameplay uses them.

## Technical contract
`assets/art-manifest.js` is the only mapping the game uses. Final art can replace TEMP files without rewriting learning logic.
