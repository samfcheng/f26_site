# f26_site

Personal portfolio built as a slideshow editor: a scrolling deck of slides with a
thumbnail sidebar.

## Structure

- `src/lib/slides/` — one component per slide, plus `index.js`, the deck manifest.
  A slide is `{ id, title, component, children? }`; slides with `children` are
  parents whose sub-slides can be collapsed, and start collapsed.
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
  - `Agentation.svelte` — dev-only visual feedback toolbar (see below).

Slide content is deliberately placeholder — pastel backgrounds and dummy text.

## Responsive

There is one breakpoint (860px). Above it the deck is 16:9 and the slide list is
a fixed column; below it the deck is 3:4 and the list becomes an overlay.

Slides are authored at a fixed canvas size — 1280×720 or 780×1040 — and scaled
to fit, so each slide is laid out once per mode instead of at every width. The
canvas is a CSS container named `slide`, so a slide adapts with:

```css
@container slide (max-width: 900px) {
	/* portrait */
}
```

Because that keys off the canvas rather than the viewport, thumbnails show the
same layout the full slide has.

`--gap` in `app.css` is the single spacing value: between slides, and from a
slide to the edge of the deck.

## Type

PP Neue Montreal, self-hosted from `static/fonts` and declared in `app.css`.
`Book` sits between Light and Regular in this family, so it is mapped to 350 —
the rest are the usual 100/300/400/500/600/700. The three weights the UI
actually uses are preloaded in `app.html`.

## Adding a slide

1. Add a component in `src/lib/slides/`.
2. Add an entry to the array in `src/lib/slides/index.js` — nest it under a
   parent's `children` to make it a sub-slide.

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

The play button floating over the deck offers two ways to start:

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

Components are in `src/lib/components/present/` — `PresentButton`,
`PresentPopover`, `PresentMenuList`, `PresentStage`, `PresentBar` and
`SlideCounter` — and the state, channel and entry points are in
`src/lib/present.svelte.js`.

## Keyboard

- `↑` `↓` `←` `→` (or PageUp/PageDown) move between slides.

## Agentation

[Agentation](https://agentation.com) is a React component, so it is mounted into
a React root by `src/lib/components/Agentation.svelte`. It is dynamically
imported and dev-only, so React never reaches the production bundle.

For annotations to sync to a coding agent, also install the MCP server:

```bash
npx add-mcp        # any agent — pick agentation-mcp
# or, Claude Code only:
npx agentation-mcp init
npx agentation-mcp doctor
```

Restart the agent afterwards. Until the server is running on port 4747, the
toolbar logs one warning and falls back to local storage.

## Develop

```bash
npm run dev
npm run build && npm run preview
```
