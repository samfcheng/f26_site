# Architecture

How a slide gets on screen, and why the pieces are shaped the way they are.

## The two rendering modes

`SlideStage.svelte` renders a slide one of two ways, and everything else follows
from which one you get.

**Fluid** (`<SlideStage fluid>`) — the slide lays itself out at its real size
inside a box of the right aspect ratio. Nothing is transformed. 16px is 16px.
This is the deck (`DeckCard`) and the show (`PresentStage`).

**Scaled** (the default) — the slide is laid out on a fixed canvas from `STAGE`
and CSS-scaled down to fit. This is thumbnails, in the sidebar and in the
presenter window's slide list. A thumbnail can't be fluid: a 240px-wide row
would render the *phone* layout at 240px, which is unreadable and also a lie
about what the slide looks like. Laying it out at 1920 and shrinking the result
keeps it a faithful miniature, because 1920 is close to a real deck card's width.

The scaled canvas is marked `data-render="thumb"`, which is how a slide can tell
it is being drawn as a thumbnail. `WorkCover` uses this to collapse its blur
stack — see [slides.md](slides.md#the-dissolve).

## Three shapes, three drawings

A slide takes one of three aspect ratios:

| viewport | shape | canvas | design grid |
| --- | --- | --- | --- |
| > 1280px | 16:9 | 1920×1080 | `--px: 100cqw / 1920` |
| 860–1280px | 1:1 | 1080×1080 | `--px: 100cqw / 1080` |
| < 860px | 3:4 | 810×1080 | `--px: 100cqw / 420` |

The square shape exists because 16:9 in a half-width window is too short for the
composition to have anywhere to go. Below 860 the slide list also stops being a
fixed column and becomes an overlay.

`stage()` in `layout.svelte.js` and `--stage-ratio` in `app.css` both encode
those breakpoints. **They have to agree** — `stage()` sets the canvas the slide
is drawn on, `--stage-ratio` caps the deck card's width against viewport height.
Change one, change the other.

Either mode puts the slide in a CSS container named `slide`, so the same rules
drive both. They key off the canvas *shape*, not a width:

```css
@container slide (aspect-ratio < 1.4) { /* square and narrower */ }
@container slide (aspect-ratio < 0.9) { /* portrait */ }
```

Keying off shape rather than width is deliberate: a 900px-wide 16:9 deck card
and a 900px-wide 3:4 phone card want completely different layouts, and a width
query cannot tell them apart.

### Why `--px` instead of scaling

A slide's frame has a fixed aspect, so content **cannot reflow into extra height
the way a page can**. That rules out the obvious approach — fixed pixel sizes
that stay put while the layout rewraps — because a 16:9 frame at 1200px wide is
only 675px tall, and a composition drawn for 1080px of height simply will not
fit. Landscape has to be proportional.

So each shape is a separate drawing, and each carries one number: `--px`, the
size of one pixel *of that shape's mock*. Every other value in the component is
the number straight off the design — `calc(24 * var(--px))` is "24px in the
mock". Changing shape changes one declaration.

Shrinking the grid along with the frame is what keeps type legible. 15px on a
420-wide portrait mock is a real 15px on a 420px phone. 15px of the 1920 mock,
on that same phone, would land at 3px.

## Deck state

`deck.svelte.js` holds one deck for the whole session — module state, so leaving
for a presentation and coming back doesn't reset which groups are open or where
you were.

It owns: the active slide, which parents are collapsed, a registry of card
elements (so anything can scroll to a slide), stable 1..n numbering, and two
flags other components position against — `settling` (a collapse animation is in
flight, rows are still moving) and `topClear` (the first slide has not yet
reached the floating chrome).

The active slide is whichever card crosses the vertical centre of the viewport,
via an `IntersectionObserver` per card. While a programmatic scroll is in flight
the active id is *pinned* to its target, so the sidebar highlight doesn't
flicker through every slide on the way.

## Collapsing

Click a slide to select it; click the selected one again to open or close its
sub-slides. Same gesture in both panes.

A collapsed sub-slide is **not a different element** from an expanded one. It is
the same card with a `transform` that tucks it behind its parent
(`stackTransform` in `motion.svelte.js`), so expanding is one continuous
movement out of the stack rather than a swap between two representations. The
group wrapper animates its height at the same time, on the same duration and
easing. Stack geometry is measured from a real card so it can't drift from the
CSS.

Only `motion.maxStack` slivers are visible; further sub-slides hide exactly
behind the last visible one and still travel the full distance when the group
opens. A stacked slide's scale is derived from its peek, so it steps in by
exactly as many pixels as it steps down.

Slide numbers are stable: collapsing a group leaves a gap in the visible
sequence rather than renumbering everything after it.

Collapsing pins the active card in place for the length of the animation, so the
deck grows and shrinks *around* the reader instead of jumping. That pinning is a
`requestAnimationFrame` loop that adjusts `scrollTop` every frame to hold one
anchor card still.

> **The loop carries a token.** Toggling again before the last collapse finished
> used to start a second loop; the first would then hit its deadline and clear
> `settling` while rows were still moving, stranding anything positioned against
> a row (the sidebar's selection block, 25.7px adrift). Each loop now defers to
> any later one. See [decisions.md](decisions.md#the-collapse-hold-loop-needs-a-token).

### The recede wash

Each step down a collapsed stack washes toward `--stack-wash`, by
`motion.recede` per step. Without it, a black cover behind a black cover has no
edge and the sliver reads as part of the card in front.

The wash is a light grey (`#d6d6d6`), not mid-grey, and not `filter: brightness()`.
Both of those are explained in [decisions.md](decisions.md#the-stack-recede-wash).

Stacked cards also drop their `box-shadow` outline: only a 5px sliver of them
shows, and an outline drawn round the whole card puts a hairline across the
bottom of that sliver — the darkest thing under a light slide.

## Spacing

`--gap` in `app.css` is the single spacing value: between slides, and from a
slide to the edge of the deck. It changes at the 860px breakpoint.
