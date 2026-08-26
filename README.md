# f26_site

Personal portfolio built as a slideshow editor: a scrolling deck of slides with a
thumbnail sidebar.

## Structure

- `src/lib/slides/` — one component per slide, plus `index.js`, the deck manifest.
  A slide is `{ id, title, component, children? }`; slides with `children` are
  parents whose sub-slides can be collapsed, and start collapsed. The deck is a
  title slide, three projects — Multiply, Classmate, Olos, each with a case-study
  sub-slide — and a closing slide.
- `src/lib/slides/work/` — the two layouts the projects share: `WorkCover`
  (the work dissolving into the slide, with a lockup along the bottom) and
  `WorkDetail` (a strip of screens running off both edges, the project's name,
  and the facts). A project slide is a handful of props.
- `src/lib/deck.svelte.js` — shared deck state (active slide, collapsed parents,
  card registry for scroll-to), passed down via Svelte context.
- `src/lib/motion.svelte.js` — every timing, curve and stack dimension in one
  place, plus `stackTransform`.
- `src/lib/layout.svelte.js` — the breakpoint, the two canvas sizes, and the
  sidebar width (dragged from its trailing edge, remembered in `localStorage`).
- `src/lib/present.svelte.js` — presentation state and cross-window sync.
- `src/lib/components/`
  - `SlideStage.svelte` — renders slide content on a fixed canvas and scales it
    to its container, so the same component is both the full slide and its
    sidebar thumbnail.
  - `Deck.svelte` / `DeckCard.svelte` — the scrolling deck. The active slide is
    whichever card crosses the vertical centre of the viewport.
  - `Sidebar.svelte` / `SidebarItem.svelte` — numbered thumbnails.

`TitleSlide.svelte` is the headline from samcheng.co: the whole composition is
sized in `em` off one `font-size`, which is itself in `cqw` — it is a display
headline, so it fills whatever frame it is given, at any width and in either
canvas shape. Its chips are interactive — hovering one wipes its colour across the
words it belongs to, and the orange chip opens a note. It uses `role="button"`
rather than a real `<button>`, which would be nested inside the sidebar
thumbnail's button and get broken apart by the HTML parser on hydration.

The closing slide is still a placeholder.

## Responsive

A slide takes one of three shapes. Above 1280px the deck is 16:9; between 860
and 1280 it squares up, because 16:9 in a half-width window is short enough that
the composition has nowhere to go; below 860 it is 3:4 and the slide list turns
from a fixed column into an overlay. `stage()` and `--stage-ratio` have to agree
about where those lines fall.

In the deck and the show a slide is **fluid**: it lays itself out at its real
size inside a box of the right aspect, nothing is transformed, and it responds
to the space it is given the way a page does. A thumbnail can't be fluid — a
240px row would render a mobile layout at unreadable size — so it lays the slide
out at the canvas width in `STAGE` and scales the result down. That width is
1920, near a real deck card's, which is what keeps a thumbnail a faithful
miniature.

Either way the box is a CSS container named `slide`, so the same rules drive
both, and they key off the canvas *shape* rather than a width:

```css
@container slide (aspect-ratio < 1.4) { /* square and narrower */ }
@container slide (aspect-ratio < 0.9) { /* portrait */ }
```

A slide's frame has a fixed aspect, so content cannot reflow into extra height
the way a page can — which means a slide is drawn three times, not scaled three
times. The work slides carry the three drawings as one number each: `--px`, one
pixel of the mock — `100cqw / 1920`, `100cqw / 1080`, `100cqw / 420`. Every
other value is the number straight off the design. Shrinking the grid with the
frame is what keeps type legible: 15px of a 420-wide mock is a real 15px on a
420px screen, where 15px of the 1920 mock would land at 3.

`--gap` in `app.css` is the single spacing value: between slides, and from a
slide to the edge of the deck.

## Type

PP Neue Montreal, self-hosted from `static/fonts` and declared in `app.css`.
`Book` sits between Light and Regular in this family, so it is mapped to 350 —
the rest are the usual 100/300/400/500/600/700. The three weights the UI
actually uses are preloaded in `app.html`.

## Adding a slide

1. Add a component in `src/lib/slides/` — a project reuses `work/WorkCover` or
   `work/WorkDetail`.
2. Add an entry to the array in `src/lib/slides/index.js` — nest it under a
   parent's `children` to make it a sub-slide.

Project imagery lives in `static/work/<project>/`, as WebP.

## The dissolve

A cover's image doesn't stop, it dissolves — the Figma effect, in two parts over
one band: a progressive background blur (0 to 48, as six stacked
`backdrop-filter` layers, each masked in over its own slice so the blur compounds
rather than steps) and a linear fill of the background colour with stops at 0%,
90% at 66%, and 100%. The blur is what makes it read as depth instead of a
curtain; without it the image stays sharp while it dims and the eye keeps trying
to read it.

The band is measured against the **image**, not the slide, and always ends where
the image does — `--from` and `--to` in `WorkCover`, which belong to the
placement rather than to the project. That is what holds up when the slide
squares up: there a landscape screen is set to the full width and stops well
short of the bottom, and a dissolve measured against the slide would leave its
edge showing.

## Collapsing

Click a slide to select it; click the selected one again to open or close its
sub-slides. This works the same in the sidebar and in the deck.

A collapsed sub-slide is not a different element from an expanded one — it is
the same card with a `transform` that tucks it behind its parent
(`stackTransform` in `deck.svelte.js`), so expanding is one continuous movement
of the slides out of the stack rather than a swap between two representations.
The group's wrapper animates its height at the same time; both use `COLLAPSE_MS`
and the same easing, and the stack geometry is measured from a real card so it
can't drift from the CSS.

Each step down a collapsed stack also washes toward `--stack-wash`
(`motion.recede` sets how far) — a black cover behind a black cover has no edge
otherwise, and the sliver reads as part of the card in front of it. The wash is
a light grey rather than mid-grey on purpose: a mid-grey moves both ends of the
range equally, which leaves a dark slide barely separated while dragging a light
one visibly grey. At `#d6d6d6` and one 20% step, `#000` lifts to 43 and `#fff`
only drops to 247.

Not `filter: brightness()`: that multiplies, so it cannot lift `#000` off itself
at all, and a `filter` there would create a backdrop root and break the covers'
dissolve.

Only `motion.maxStack` slivers are visible in a collapsed stack; any further
sub-slides hide exactly behind the last visible one and still travel the whole
distance when the group opens. A stacked slide's scale is derived from its peek,
so it steps in by exactly as many pixels as it steps down, in both panes.
Hovering a collapsed slide pulses its stack out and back to advertise that
clicking will expand it — desktop pointers only.

Slides are numbered 1..n straight through, sub-slides included, and those
numbers are stable: collapsing a group leaves a gap in the visible sequence
rather than renumbering the slides after it.

Collapsing or expanding also pins the active card in place for the length of the
animation, so the deck grows and shrinks around the reader instead of jumping.

## Presenting

The play button floats over the top-right of the deck, and steps out of the way
— up and out, rather than only fading — as the first slide rises to meet it, a
little before the two would touch. An open menu stays put: pulling it out from
under the pointer mid-choice is worse than letting it overlap for a moment.
`Deck.svelte` measures the gap and reports it as `deck.topClear`.

It offers two ways to start:

- **Presentation** (`⌥⌘↵`) — `/present`. The slide is letterboxed in black at
  whatever size fits. Any pointer movement brings back the chrome — the wordmark
  and a way out at the top, the slide counter at the bottom — and it leaves
  again, with the cursor, once the pointer settles. Click or arrow to advance,
  `Esc` to leave: you come back to the editor on the slide you finished on, with
  its group opened if it was collapsed.
- **Presentation with notes** (`⌥⇧⌘↵`) — the same show, plus a separate window
  (`popup=yes`, not a tab) at `/present/notes` with the deck on the left and
  speaker notes on the right.

The show's chrome is the same floating white surface as the rest of the app
rather than a dark scrim, so it stays legible over a black bar and a white slide
alike: one round chip at the top centre to leave, and the counter at the bottom.

The two windows stay in step over a `BroadcastChannel`; either can drive. Ending
the show closes the presenter window. Notes live on the slide definitions in
`src/lib/slides/index.js`.

The join protocol is in `src/lib/present-channel.js`, deliberately apart from
the reactive state so it can be tested without a browser. One rule holds it
together: **a window that has just opened asks where the show is — it never
announces a position of its own.** The presenter window starts at slide 1 like
any other document, so announcing that on join would drag a running show back to
the beginning. Only the stage (`connect({ stage: true })`) announces, and only
it answers `hello`. Once the show is running either window may move it, because
a `go()` is a deliberate move rather than a stale opinion.

`present-channel.test.js` pins that down — it fails if a joining window starts
announcing again.

Components are in `src/lib/components/present/` — `PresentButton`,
`PresentPopover`, `PresentMenuList`, `PresentStage`, `PresentBar` and
`SlideCounter` — and the state, channel and entry points are in
`src/lib/present.svelte.js`.

## Keyboard

- `↑` `↓` `←` `→` (or PageUp/PageDown) move between slides.

## Develop

```bash
npm run dev
npm run build && npm run preview
npm test                 # node --test, no browser needed
```
