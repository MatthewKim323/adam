# REBUILD: hero

> Captured 2026-09-29T23:50:09.949Z by clonethis. One component, measured at every width. Build from these files; never eyeball a number.

## Origin blackout (not optional)

This is Adam's component now. Nothing you write may say where it came from: not a file name, class name, comment, alt text, commit message or reply. The source url and the source selector live in `reference/hero/.origin.json` for the rigs and nowhere else.

- Everything in this folder is already scrubbed: the origin's words read as `Adam`, its links are route-relative, assets are content addressed (`img-<hash>.webp`, `font-<hash>.woff2`). Copy from here and you stay clean. Never copy from a live browser tab.
- A logo or wordmark inside the component still carries the origin visually: keep it as a placeholder, name it neutrally, flag it.
- `clonethis blackout .` must print CLEAN; `clonethis verify` runs it.

## The component

| width | root (w x h) | elements | text runs | media | height from | html variant |
|---|---|---|---|---|---|---|
| desktop 1440 | 1400 x 1021.83 | 125 | 17 | 18 | content | 0 |
| tablet 1024 | 984 x 845.83 | 125 | 14 | 18 | content | 1 |
| tablet-810 810 | 770 x 845.83 | 128 | 17 | 18 | content | 2 |
| mobile 390 | 370 x 837.25 | 124 | 16 | 18 | content | 3 |

**The page renders 4 different subtrees across widths** (html variant column). Build each one (or one component that switches at the same breakpoints): `dom/<vp>.html` holds each.

Stack of the page: framer. Framer: appear ids, data-framer-name layer names, per-breakpoint class rules. The module rip applies.

CSS: 74 rules used (18 behind a breakpoint / condition, 3 for states), 0 keyframes, 5 font faces, 97 custom properties. Assets: 15.

## Ground truth in this folder

- `spec/component.txt`: START HERE. The tree (tag, `@cN` id, layer name, classes, inline style, text) then every css rule that applies, split into at rest / by breakpoint / for states, each with the ids it matched per width.
- `css/used.css`: those rules as a stylesheet, in cascade order, with the @font-face and @keyframes they need, urls pointing at `assets/`. `css/rules.json` is the same with matches; `css/vars.json` the custom property values per width.
- `dom/component.html` (desktop) and `dom/<vp>.html`: the subtree as rendered, urls local. `dom/symbols.svg`: svg defs it references from elsewhere on the page.
- `capture/<vp>/component.png` (2x, exactly the root's box), `context.png` (40px around it), `layout.json` (every element: rect relative to the root + computed styles + ::before/::after), `texts.json` (every painted text run with its glyph box: what verify checks), `media.json`, `context.json` (inherited type, backdrop, ancestor chain, whether its height came from its container), `interactive.json`, `animations.json`.
- `capture/states/` + `motion/states.md`: hover / press / focus / open, every computed property that changed and the transition in effect, with shots.
- `capture/frames/` + `motion/frames.md`: 60fps screencasts cropped to the component: entrance (load or scroll-in), each hover / toggle, loops.
- `motion/transitions.json`, `motion/animations.json` (running WAAPI / CSS animations with keyframes and timing), `motion/keyframes.css`. Framer pages: `motion/framer-appear.json`, `motion/rip.md` + `constants.json` (focused on this component), `modules/`.
- `snapshot/index.html`: the component standing alone (html + used css + fonts + assets + inherited context). Static: no script runs in it.

## Snapshot self-check

> The snapshot run through the same gate your build will face. Where it fails, the static extraction is not enough on its own and the reason is usually script: a JS-measured layout, a spring mid-flight, a canvas. Build from the spec and the frames there.

| width | gate | height | text runs | media | pixels |
|---|---|---|---|---|---|
| desktop | PASS | 1021.83 / 1021.83 | 17/17 | 18/18 | 0% |
| tablet | FAIL | 845.83 / 845.83 | 14/14 | 18/18 | 4.96% |
| tablet-810 | PASS | 845.83 / 845.83 | 17/17 | 18/18 | 2.94% |
| mobile | FAIL | 837.25 / 837.25 | 16/16 | 8/18 | 2.34% |

## States

| # | target | hover | press | focus | open | back to rest |
|---|---|---|---|---|---|---|
| 0 | link a | 11 | 35 | 15 | - | no |
| 1 | field input | 13 | - | 18 | - | no |

Numbers are changed properties. Details and transitions in `motion/states.md`.

## Motion recorded

| scenario | frames | motion ms | |
|---|---|---|---|
| load | 293 | 270 -> 5514 |  |
| hover-00-link | 170 | 35 -> 3069 |  |
| hover-01-field | 170 | 32 -> 3068 |  |
| loop | 330 | 34 -> 6148 | no change on hover |

## The loop

Put `data-clone-root` on your component's root element and render it on a page of the dev server.

```bash
clonethis shot http://localhost:3777/<page> reference/hero/build/1440.png --ref reference/hero --w 1440      # your component, pinned like the reference
clonethis compare http://localhost:3777/<page> reference/hero --w 1440                             # every text run + media box: yours vs reference, deltas
clonethis boxes http://localhost:3777/<page> 1440 --ref reference/hero  /  clonethis refboxes reference/hero desktop   # element boxes, same columns
clonethis states http://localhost:3777/<page> reference/hero                                     # hover / press / focus / open: yours vs reference
clonethis frames http://localhost:3777/<page> reference/hero/build/frames/enter --scenario enter --ref reference/hero && clonethis sheet reference/hero/build/frames/enter a.png && clonethis sheet reference/hero/capture/frames/enter b.png
clonethis verify http://localhost:3777/<page> reference/hero                                      # THE GATE: PASS at every width or keep going
clonethis blackout .
```

Rules for the build are in `reference/CONVENTIONS.md` (written by `clonethis init`). Method: the clonethis skill `docs/METHOD.md`.
