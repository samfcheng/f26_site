# Contributing

## Getting going

```bash
npm install
npm run dev                  # http://localhost:5173
npm test                     # node --test, no browser needed
npm run build && npm run preview
```

There is no lint or format step wired up. Match the file you are in.

## How this codebase is written

**Comments explain *why*, never *what*.** The code says what it does. A comment
earns its place by recording the thing that isn't visible: what was tried first,
what broke, what constraint forced the shape. If you fix something subtle, leave
the reasoning behind — most of the comments here exist because someone would
otherwise "simplify" the fix back out.

**One number, one place.** Timings, easings and stack geometry live in
`motion.svelte.js`. Breakpoints and canvas sizes live in `layout.svelte.js`.
Colours and spacing live in `app.css`. Slide dimensions are `calc(N * var(--px))`
where N is the number off the mock. If you find yourself typing a magic number
into a component, check whether it belongs in one of those.

**Prefer transforms.** The one deliberate exception is the collapse accordion's
`height`, which has no transform equivalent.

## Verifying visual work

This is the part that matters most here, and it is not optional. Several of the
subtlest bugs in this project were invisible to the eye and obvious in the
numbers — a fade that looked right but was a different curve, a selection block
25.7px adrift, a hairline nobody could name until it was sampled.

**Measure the mock, don't eyeball it.** When matching a design, screenshot your
render at the mock's dimensions and diff them numerically. The covers were
matched to a mean row-luminance difference of 1.09–2.47 over the fade band that
way; by eye, three visibly different curves all looked "about right".

Useful shapes for this, all with Python + Pillow:

- Row/column luminance means to compare a gradient against a mock.
- Ink bounding boxes per text band to solve for a font size, rather than
  guessing. (`font-size` 24 vs 23 changed a line break; only measuring caught it.)
- Compositing arithmetic checked against a real render before trusting it.

**Reconstruct the baseline properly.** If you compare a render to a mock you
must place the source image the same way the browser does — same scale, same
`object-position`, composited onto the same background. Source PNGs here carry
alpha; flattening onto black instead of the slide's real background will make
every number wrong and send you chasing a fade that isn't broken.

**Drive the browser when the DOM is the question.** Headless Chrome over the
DevTools Protocol handles the cases a screenshot can't: computed styles, hover
states, frame timing, and event sequences. `--window-size` on the screenshot CLI
does *not* reliably set the layout viewport — use
`Emulation.setDeviceMetricsOverride` and `Page.captureScreenshot`, or you will
debug a layout bug that doesn't exist.

**Prove the fix by reproducing the bug.** For anything timing-dependent, write
the check, confirm it fails against the old behaviour, then confirm it passes.
The collapse-token fix was verified by neutering the guard and watching the same
script go from 0px to 25.7px of drift. A test that has never failed has told you
nothing.

**Headless has no GPU.** It falls back to software rendering, so anything
compositing-bound — `backdrop-filter`, blur, large transforms — cannot be
measured here honestly. Say so rather than reporting a number you don't believe.

## A scratch route

For checking one slide at an exact size, a temporary `src/routes/shot/+page.svelte`
that renders `flatSlides.find(...)` inside `<SlideStage fluid canvas={{width, height}}>`
makes `/shot?id=multiply&w=1920&h=1080` screenshot-able. **Delete it when you are
done** — it has been added and removed several times and should not land in a
commit.

## Gotchas that have bitten

- **Class name collisions across components.** Svelte scopes styles, so nothing
  breaks visually — but `document.querySelectorAll('.row')` picks up both the
  sidebar's rows and any slide that uses the same name. Prefer `[data-item]`
  and similar for queries.
- **A dangling import in the root layout 500s every server-rendered route.**
  It presents as one page being broken, because client-side navigation never
  re-runs SSR — you only see it on a fresh document load. Check `/`, `/present`
  and `/present/notes` with `curl -o /dev/null -w '%{http_code}'` after touching
  `+layout.svelte`.
- **`stage()` and `--stage-ratio` must agree** about where the breakpoints fall.
- **Anything interactive inside a slide** must be a span with a role, not an
  `<a>` or `<button>`. See [docs/slides.md](docs/slides.md#interactive-elements-inside-slides).
- **`filter` creates a backdrop root.** Adding one to an ancestor of the cover
  slides will silently break the dissolve.

## Before you finish

- `npm test` and `npm run build` both clean.
- No scratch route left in `src/routes/`.
- If you changed a cover, re-diff it against its mock in
  `~/Downloads/portfolio_redesign_f26/` — the numbers are in
  [docs/decisions.md](docs/decisions.md).
- If you made a non-obvious call, add it to
  [docs/decisions.md](docs/decisions.md). That file is the point.
