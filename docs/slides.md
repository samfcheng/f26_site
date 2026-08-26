# Slides

## The manifest

`src/lib/slides/index.js` is the deck. A slide is
`{ id, title, component, notes?, children? }`; slides with `children` are
parents whose sub-slides collapse, and they start collapsed.

Current order: a title slide, three projects — Multiply, Classmate, Olos, each
with a case-study sub-slide — and a closing slide.

`flatSlides` is every slide in presentation order, sub-slides included. In dev,
`index.js` checks each entry has a component and names the culprit if not: a
slide whose component is `undefined` otherwise fails as an opaque
"Cannot read properties of undefined" from deep inside Svelte, usually because
the dev server's module graph went stale after a rename.

## The two work layouts

A project slide is a handful of props over one of two shared components in
`src/lib/slides/work/`.

### `WorkCover`

The work itself, dissolving into the slide, with a lockup along the bottom.

| prop | meaning |
| --- | --- |
| `name`, `badge`, `image`, `alt` | the project and its imagery |
| `description` | one or two lines; flush right in landscape |
| `action` | `{ label, href }` — the pill. Omit for no pill |
| `theme` | `'light'` \| `'dark'` — how the lockup reads, not how bright the image is |
| `background` | defaults from `theme` |
| `anchor` | `object-position` once the image covers its box |
| `shot` | `'bleed'` \| `'inset'` \| `'card'` — see below |

`shot` sets both the image placement and where the dissolve falls, because the
two are the same fact: how far down the image the slide's bottom edge lands.

- **`bleed`** — a photograph, given the whole frame. (Olos)
- **`inset`** — a screen set to a width, hanging off the bottom of the slide.
  The dissolve has to finish at the *slide's* edge, not the image's, hence
  `--to: 82%`. (Classmate)
- **`card`** — a screen at its own size, centred, with a radius, flush with the
  bottom edge. (Multiply)

### `WorkDetail`

A strip of screens running off both edges, the project's name, and the facts.

| prop | meaning |
| --- | --- |
| `name` | project name |
| `shots` | `{ src, alt }[]` — the strip, centred so it overflows both edges |
| `info` | `[label, value][]` — the Info column |
| `goal` | one paragraph |
| `theme` | `'dark'` (default) \| `'light'` |

In the light theme the screens get a hairline edge: they are light-UI-on-white
and would otherwise dissolve into the page rather than reading as objects.

## The dissolve

A cover's image doesn't stop, it dissolves. Two parts over one band, both from
the Figma effect:

1. **A progressive background blur, 0 → 48.** Six stacked `backdrop-filter`
   layers, each masked in over its own slice of the band, so going down the
   image one more blur stacks on at a time and the blur *compounds* rather than
   steps. Radii and slices live in `nth-child` rules so a thumbnail can override
   them.
2. **A linear fill of the background colour**, stops at 0%, 90% at 66%, 100%.

The blur is what makes it read as depth instead of a curtain. Without it the
image stays sharp while it dims, and the eye keeps trying to read it.

**The band is measured against the image, not the slide**, and always ends where
the image does (`--from` / `--to`, set per `shot` class). That is what holds up
when the slide squares up: there a landscape screen is set to the full width and
stops well short of the bottom, and a dissolve measured against the slide would
leave its edge showing.

In a thumbnail the six layers collapse to one pass spanning the whole band.
Six real backdrop reads of a 1920px canvas resolve, at 240px wide, to a picture
nobody can tell from one. That took the painting layer count from 36 to 21.

## Imagery

Project imagery lives in `static/work/<project>/`, as WebP.

Convert with `cwebp` — lossless for badges (small, crisp edges), q90 for UI
screenshots, q82 for photographs:

```bash
cwebp -quiet -lossless -alpha_q 100 badge.png -o badge.webp
cwebp -quiet -q 90 screenshot.png -o screenshot.webp
cwebp -quiet -q 82 photo.png       -o photo.webp
```

The current set went 2.9 MB → 568 KB this way.

Source PNGs may carry an alpha channel (Classmate's cover does). That matters if
you ever measure them with a tool that flattens onto black — composite onto the
slide's real background first or every measurement will be wrong.

## Adding a slide

1. Add a component in `src/lib/slides/`. A project reuses `work/WorkCover` or
   `work/WorkDetail`; anything else is a plain `<section>` with its own `--px`
   block per shape.
2. Add an entry to the array in `src/lib/slides/index.js`. Nest it under a
   parent's `children` to make it a sub-slide.
3. Give it `notes` if you will present it.

## Interactive elements inside slides

Anything clickable in a slide must **not** be an `<a>` or `<button>`. In the
sidebar the whole slide is the content of a `<button>`, and the HTML parser
breaks that nesting apart on hydration. Use `role="link"` / `role="button"` on a
span with a keydown handler, and `stopPropagation` in the click handler so it
doesn't also select the card. `TitleSlide`'s chips, `WorkCover`'s pill and
`ContactSlide`'s chips all do this.

Thumbnails set `pointer-events: none` on slide content, so these are inert there
and live only in the deck and the show.
