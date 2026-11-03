# Decisions

## Multiply’s first case study draft

Multiply has a dedicated story component so its long-form draft can evolve without
adding unfinished content to Classmate or Olos. Shared figure rendering supplies
intrinsic image sizes, lazy loading, full-size links, and explicit placeholders.
The 4× outcome is contact volume, separate from the ~95% 24-hour contact rate;
the comparison periods are stated rather than implying a controlled experiment.
See `multiply-draft-notes.md` for source mapping and unresolved editorial details.

Things that look odd until you know why. If you are about to "simplify" one of
these, read the entry first — most were tried the obvious way and it didn't hold.

---

## Slides are proportional in landscape, not fixed-px

**Wanted:** type that stays 16px across desktop sizes while the layout reflows,
like a normal page.

**Why it can't:** a slide's frame has a fixed aspect. A 16:9 card at 1200px wide
is 675px tall, and content drawn for 1080px of height has nowhere to reflow *to*
— a page can grow downward, a slide cannot. Landscape has to scale.

**What we do instead:** each shape is a separate drawing on its own grid
(`--px`), and the portrait grid is 420 wide rather than 1920. That is where the
legibility win actually lives: 15px of a 420 mock is a real 15px on a phone,
where 15px of the 1920 mock would land at 3px. See
[architecture.md](architecture.md#why---px-instead-of-scaling).

---

## The dissolve is measured against the image, not the slide

If the band is a share of the *slide*, it works in landscape and breaks
everywhere else: at 1:1 a landscape screen set to full width stops around 65%
down, and a slide-relative fade leaves the image's hard bottom edge showing.

Measuring against the image means the fade always finishes on the image's last
row, whatever shape the frame is. The cost is one number per placement (`--to`
is 82% for `inset`, because that image hangs off the bottom of the slide).

---

## The blur is six `backdrop-filter` layers

Progressive blur, not uniform: each layer is masked in over its own slice of the
band and blurs what the layers before it already blurred, so the blur compounds
down the image instead of stepping.

**Known risk, unverified:** 18 painting layers in the deck. GPU compositing cost
could not be measured here — headless Chrome falls back to software rendering,
which would wildly misreport it. If the deck janks on real hardware during
scroll or a collapse, the swap is pre-blurred `filter: blur()` copies of the
image, which rasterise once instead of re-reading the backdrop each composite.
Contained to `WorkCover`.

Thumbnails already collapse the six to one — see
[slides.md](slides.md#the-dissolve).

---

## The stack recede wash

A collapsed sub-slide shows a 5px sliver. Against a slide of its own colour that
sliver has no edge, so a black cover behind a black cover reads as one card.

**Not `filter: brightness()`.** Brightness multiplies, so `#000 × anything` is
still `#000` — it cannot lift the exact slides that need it. And a `filter`
there would create a **backdrop root**, cutting the cover's `backdrop-filter`
layers off from what they are meant to blur.

**Not opacity.** Stacked translucent layers composite through each other, so
overlapping slivers go uneven.

**A mid-grey wash is symmetric**, which is the wrong shape for the problem: it
moves both ends of the range equally, so the setting that makes a dark sliver
visible is the one that drags a light sliver visibly grey.

**What we do:** an opaque overlay of `--stack-wash` (`#d6d6d6`) at
`motion.recede` per step. A light wash has a long way to travel from black and
almost none from white, which is exactly the asymmetry wanted:

| | mid-grey `#808080` | light `#d6d6d6` |
| --- | --- | --- |
| `#000` sliver | 26 | **43** |
| `#fff` sliver | 230 | **247** |

Measured on the real render, not just the arithmetic.

---

## Stacked cards drop their outline

Every card carries `box-shadow: 0 0 0 1px var(--line)`. On a stacked card, only
a 5px sliver shows — and the outline puts a hairline right across the bottom of
that sliver, which under a light slide is the darkest thing there (229 against a
247 sliver on a 255 pane). Stacked cards set `box-shadow: none`; the sliver's
own edge against the pane is enough.

---

## Interactive elements in slides are spans with roles

Not `<a>` or `<button>`. In the sidebar the whole slide is the content of a
`<button>`, and the HTML parser breaks that nesting apart on hydration. See
[slides.md](slides.md#interactive-elements-inside-slides).

---

## Escape in the show listens to `fullscreenchange`

The browser eats the Escape keydown in fullscreen. Full reasoning in
[presenting.md](presenting.md#escape-needs-the-fullscreen-event-not-the-keydown).

---

## The collapse hold loop needs a token

`deck.toggle` pins the anchor card with a `requestAnimationFrame` loop and
clears `settling` when it expires. Toggling again mid-animation started a second
loop — and then the **first** hit its deadline and cleared `settling` while rows
were still moving. That kills the sidebar's frame-by-frame tracking effect
early, stranding the selection block wherever it happened to be, with nothing
left to re-measure it.

Each loop carries a token and defers to any later one. Verified: six clicks
60–90ms apart leave the selection at **0px drift**; with the guard removed the
same script reproduces **25.7px**.

Two loops also fought over `scrollTop`, each pinning a different anchor. Same
fix.

---

## Thumbnails are not pre-rendered at build time

The idea is sound and it is what desktop slide apps do — but not here.

**Speed is not the problem.** Over five collapse cycles the sidebar accounts for
0.065s of 0.162s of task time (~40%), and it is about half the DOM (245 of 503
nodes). But that is ~13ms per collapse in a *software* renderer, and deck
scrolling costs 0.075ms/frame of style+layout. There is no perceptible saving to
buy.

**Accuracy runs the other way.** Today the thumbnail *is* the slide component —
same code, same container queries, it cannot drift. A build-time image is
accurate as of the last build; edit a slide, forget the step, and the sidebar
lies silently. You would also downsample vector text instead of rendering it at
size.

**What the real ones do:** Keynote, PowerPoint and Google Slides all cache
thumbnails as rasters — Google Slides serves thumbnail images from the server —
but at **runtime, keyed to slide content, invalidated on every edit**. They can,
because they own a document model and know exactly when slide 7 changed. Figma
Slides is different again: a canvas/WebGL renderer drawing from one scene graph
with its own tile cache.

Here the slides *are* Svelte components, so the only reliable invalidation is a
rebuild — which is why the build-step version is the one on offer, and also the
one that goes stale. Meanwhile the DOM already gives a raster cache for free: a
static subtree is not repainted per frame, only when something invalidates it
(the collapse animation, which is where the 40% shows up and nowhere else).

**Revisit at ~30 slides.** And even then the first move is virtualizing the
sidebar list so only visible rows mount — same win, no staleness, no build step.

---

## Performance work that was tried and rejected

- **`loading="lazy"` on slide images changed the payload by zero.** All 18
  sidebar thumbnails are in the viewport at load, so every image URL is
  requested regardless of what the deck does. The attributes are still there as
  future-proofing (they start paying once the deck outgrows one screen of
  sidebar) plus `decoding="async"`, but do not expect them to help today.
- **`content-visibility: auto` on deck cards** is the biggest remaining win and
  is *not* applied: `Deck.svelte` measures `.slot` rects for stack geometry and
  `deck.toggle` pins scroll by measuring card rects. Off-screen cards would
  measure 0 and break the collapse. It needs those measurements moved to a
  card guaranteed to be on-screen first.

## Performance work that was applied

- A dead `PPNeueMontreal-Bold.woff2` preload, fetched at high priority on every
  load and used by nothing. Only weights 400 and 500 appear in any component.
- `getComputedStyle` in the deck's scroll handler, now read once per reflow.
- Thumbnail blur: 36 painting `backdrop-filter` layers → 21.


## Explorations promoted to the homepage

The finalized pinboard lives under `src/lib/explorations/` and renders after Work.
Its composed positions, interruptible springs, category ordering, pin clearance,
and immediate lightbox return are preserved. Preview and full-size videos are
both intentional: the board uses the smaller loops while the lightbox loads the
larger versions. Only assets referenced by the finalized collection are kept.

Removed all `/prototypes` routes, including the desk study and pin renderer.
The renderer can be recovered from the pre-cleanup snapshot, `880db28`, on
`dev/finalize-explorations` if new pin sprites are needed.


## One badge artwork source

`static/assets/badge-artwork.png` is the supplied v2 artwork, used by both live
rendering modes and the asset renderer. Regenerate static fallbacks as well as
share media whenever it changes, so the loading image cannot show an older
design before the interactive scene appears. Unused mobile variants and old
artwork exports were removed. Share image/video URLs include a version query
to give crawlers a fresh asset URL for the new design.


## Homepage load order

The badge comes first, then the work, and the explorations only as they near
the screen. The board used to request all its media on load, which also held up
the `load` event that the 3D badge waits for, so its cards now mount their
poster and video within 600px of the viewport and pause beyond that.

The page server-renders its phone branch for every screen, so the lanyard sits
in a `<picture>` whose desktop source is a blank GIF, and the desktop still has
its own media-scoped preload. Without that, desktops download the 700 KB lanyard
and never show it. The preload names the default still, so `?filter` also
fetches the filtered one.
