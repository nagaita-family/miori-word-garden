# Miori's Word Garden — Art Direction v0.12 (updated for v0.13.1)

## 1. Core visual rule: build the Garden by layering, never by baking the finished Garden into one image
The master Garden background is scenery only. It must **not** contain the playable rabbit, Weekly animal friends, growable flowers, vegetables, seeds, gift boxes, or earned furniture.

The intended progression is:
1. start from a sparse but attractive base Garden that makes Miori think “I want to grow this place”;
2. overlay high-quality animal, flower, tree/plant, vegetable, and reward-item assets as progress is earned;
3. the Garden becomes lush only because those separate assets accumulate over days and weeks.

A rich, finished Garden image is therefore an **end-state reference**, not a production background.

## 2. Day-1 master background
The first-time Garden should feel intentionally sparse, calm, and promising rather than empty or unfinished.

Required scenery:
- central fountain and gathering area;
- empty Seed House at upper-left;
- four empty farm plots at right;
- large friendship tree / future Tree House zone at upper-right;
- paths, pond/water edge, low fence, grass, terrain and a few tiny non-growable edge accents;
- generous open grass for future flowers, animals and furniture.

Do not bake in:
- rabbit or other animals;
- growable flowers, vegetables, harvest crops or seeds;
- Tree House, bench, bird cage, mailbox, lantern, flower arch, Weekly gifts;
- UI labels, menus, progress meters or text.

## 3. Progression target
After several weeks, the same background may look rich because the game layer has added:
- many mature flowers and occasional Special Flowers;
- vegetables in different growth stages;
- several animal friends;
- Tree House and collectible furniture;
- movable reward objects arranged by Miori.

The player must be able to visually compare Day 1 and Week 4 and feel: **“I made this Garden.”**

## 4. Asset quality is more important than animation complexity
Prioritize the illustration itself over sophisticated motion.
- Every asset should look attractive even as a still image.
- Motion may be simple: short position tween, breathing/bounce, pose swap, sparkle, water and light effects.
- Never use busy animation to hide low-quality artwork.

## 5. Animal production standard
The initial rabbit and **every Weekly Challenge animal** use the same production standard.

For each species:
1. create one high-quality master character design first;
2. lock proportions, face, palette, markings, camera angle, lighting and scale;
3. create four matching pose assets of that exact same character:
   - `idle`
   - `watering`
   - `happy`
   - `eating`

Current planned animal set:
- Bunny (initial resident)
- Puppy
- Kitten
- Bluebird
- Squirrel
- Duckling
- Hedgehog

A pose that looks like a different individual is a failed asset even if the individual image is beautiful.

## 6. Movable collectibles
Animals and Weekly Special Gift items belong to a **movable overlay layer**.
- Initial Bunny: draggable.
- Weekly animal friends: draggable.
- Special Gift furniture/items: draggable.
- Flowers and vegetables: rooted in their growth spots and **not draggable**.

Dragging changes only presentation position; it must never change learning progress or reward ownership.

## 7. Plant asset families
### Flowers
One flower family must be designed as a consistent set:
1. sprout
2. leaves
3. bud
4. bloom
5. Special Flower variant

### Vegetables
Each vegetable must share one coherent illustrated identity across four stages:
1. seed
2. sprout
3. growing plant
4. ready to harvest

Initial vegetable families:
- carrot
- tomato
- pumpkin
- corn may follow after the first three are polished.

## 8. Visual tone — reduce the “AI image” feeling
Aim for an illustrator-made picture-book / miniature-diorama world, not maximal generative detail.
- one fixed 3/4 isometric-ish camera;
- one consistent upper-left light direction;
- consistent scale between background and every transparent asset;
- restrained palette: warm cream wood, soft leaf greens, clear water blue, small pink/yellow/lilac accents;
- hand-painted or crafted texture rather than glossy plastic rendering;
- purposeful composition and negative space;
- fewer random flowers, sparkles and decorative clutter;
- no fake depth-of-field/bokeh as a default;
- no illegible generated signs or baked-in text;
- architecture proportions must stay consistent across every asset.

## 9. UI placement
Garden navigation UI is outside the illustrated Garden area. The Garden itself should remain a readable play space for scenery, animals, plants and movable rewards.

## 10. Achievement-effect direction
Learning accomplishments may have richer **screen effects and sound**, but those effects are temporary overlays and must never become part of the base artwork.

Use stronger celebration for:
- Focus / Encore word completion → watering scene;
- Quick Review completion → Seed earned scene;
- Bonus Sun → bright sunshine event;
- Weekly Challenge Clear → celebration;
- Weekly Challenge Perfect → larger distinct celebration;
- Present Box opening → reveal celebration.

Effects should reinforce achievement while keeping the underlying artwork clean.

## 11. Asset production order
1. scenery-only Day-1 master background
2. Bunny master character + idle / watering / happy / eating
3. one flower family + Special Flower
4. carrot four-stage family
5. tomato four-stage family
6. pumpkin four-stage family
7. Weekly animal friends, one species at a time, each with all four poses
8. Special Gift furniture assets
9. additional plant/vegetable variety only after the quality bar is stable
