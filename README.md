# f26_site

Sam Cheng's portfolio, built as a slideshow editor: a scrolling deck of slides
with a thumbnail sidebar, and a presentation mode with speaker notes.

The conceit is that the portfolio *is* the deck. There is no separate "site" and
"slides" — the same components render as the scrolling page, as the sidebar
thumbnails, and as the full-screen show.

```bash
npm install
npm run dev
```

## Where things are

```
src/lib/slides/          one component per slide + index.js, the deck manifest
src/lib/slides/work/     WorkCover / WorkDetail — the two shared project layouts
src/lib/components/      SlideStage, Deck, Sidebar, and present/
src/lib/deck.svelte.js   deck state: active slide, collapsed groups, card registry
src/lib/motion.svelte.js every timing, curve and stack dimension
src/lib/layout.svelte.js breakpoints, canvas sizes, sidebar width
src/lib/present.svelte.js presentation state and cross-window sync
static/work/<project>/   project imagery, WebP
docs/                    the long-form documentation
```

## Docs

| | |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | How a slide gets on screen: the two rendering modes, the three shapes, `--px`, deck state, collapsing |
| [docs/slides.md](docs/slides.md) | The manifest, `WorkCover` / `WorkDetail`, the dissolve, imagery, adding a slide |
| [docs/presenting.md](docs/presenting.md) | The show, the two-window protocol, the fullscreen/Escape problem |
| [docs/decisions.md](docs/decisions.md) | **Why the odd bits are odd.** Read before "simplifying" anything |
| [docs/open-questions.md](docs/open-questions.md) | What is unfinished, unverified, or waiting on a call |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Conventions, and how to verify visual work properly |

## The shape of it in one page

**One component, three renderings.** `SlideStage` draws a slide either *fluid*
(the deck and the show — real layout at real size) or *scaled* (thumbnails — laid
out on a fixed canvas and shrunk, so a 240px row is a faithful miniature rather
than a phone layout at unreadable size).

**Three shapes, three drawings.** 16:9 above 1280px, square between 860 and
1280, 3:4 below. A slide's frame has a fixed aspect, so content cannot reflow
into extra height the way a page can — each shape is drawn separately, and each
carries one number, `--px`, the size of one pixel of that shape's mock. Every
other value in a slide is the number straight off the design.

**The deck is the sidebar is the show.** Collapsing a group, selecting a slide
and scrolling all run through `deck.svelte.js`, so both panes agree without
knowing about each other.

**The covers are matched to their mocks numerically**, not by eye — to a mean
row-luminance difference of 1.09–2.47 across the dissolve. If you change one,
re-diff it. [CONTRIBUTING.md](CONTRIBUTING.md#verifying-visual-work) explains how.

## Type

PP Neue Montreal, self-hosted from `static/fonts` and declared in `app.css`.
`Book` sits between Light and Regular in this family, so it is mapped to 350 —
the rest are the usual 100/300/400/500/600/700. Only 400 and 500 are used by any
component, and those two are preloaded in `app.html`. If you start using another
weight, preload it; if you stop using one, drop the preload — a preloaded font
nothing uses is fetched at high priority on every page load for nothing.

## Keyboard

| | |
| --- | --- |
| `↑` `↓` `←` `→`, PageUp/PageDown | move between slides |
| `⌥⌘↵` | present |
| `⌥⇧⌘↵` | present with notes |
| `Esc` | leave the show |

## Scripts

```bash
npm run dev
npm run build && npm run preview
npm test                 # node --test, no browser needed
```
