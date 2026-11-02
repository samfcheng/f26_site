# Sam Cheng — Portfolio

Desktop-first SvelteKit portfolio based on the F26 Figma design. Uses PP Kyoto,
interactive Three.js / Rapier badge physics, and a shared plotter shader.

## Development

```sh
npm install
npm run dev
npm run build
npm test
```

- `src/routes/+page.svelte`: hero, work, explorations, and footer layout.
- `src/lib/components/Work.svelte`: hover/focus project previews.
- `src/lib/projects.js`: original project descriptions, dates, and preview images.
- `src/routes/work/[slug]`: prerendered case-study placeholders.
- `src/lib/badge/settings.js`: original badge defaults with plotter enabled.
- `static/assets/badge2.png`: printed badge artwork.

## Rendering

The badge is dynamically imported and pauses its animation frame loop and physics
when outside the viewport or when the document is hidden. Pixel ratio is capped
at 1.5. The original physical constraints and plotter defaults are retained.

Work labels use the same shader, rendered at progressively larger stroke widths
to cached 2D canvases after Kyoto loads
and on debounced resize. One temporary WebGL context renders all three labels,
then releases its GPU resources. Hover transitions interpolate those cached frames
over 150 ms, from fine strokes to the selected 4.5 px plotter treatment. No animation
loop runs once the transition settles. Accessible HTML labels remain underneath.
Image entrances use interruptible CSS transitions (250 ms, 35 ms stagger), with
keyboard focus and reduced-motion alternatives.

The largest download remains Rapier's embedded WASM (about 1.1 MB gzip including
badge code). Further size reduction would require a different physics build or
simpler simulation.

## Mobile

At 700 px and below the homepage has its own layout; desktop is unchanged. Phones
never load three.js or Rapier. The hero is a render of the badge on its lanyard
(`static/assets/badge-lanyard.webp`), hanging from the top edge; it sways on a
damped spring when the page scrolls or the badge is tapped (`src/lib/sway.js`),
and only animates while moving. Each project shows all three previews in a
scroll-snapping strip, then its copy and a case-study link. About opens as a
bottom sheet that can be dragged or flicked down to close.

## Share preview

`static/og.mp4` is a 4-second loop of the share card's badges sliding across,
each swinging slightly, used as the homepage's `og:video`; `card.png` stays as
the image everywhere a video doesn't play. It is rendered with Remotion from
the sibling `f26_og_video` project (`npm run render`).

Original project imagery remains in `static/work` for future case studies.

The hero fills the viewport height. Typography uses fixed pixel sizes (1 rem hero
copy, 48 px section headings, 16 px project/footer copy); only the oversized hero
name scales with viewport width. Project order is Multiply, Classmate, Olos.

The selected Fan treatment uses 250 × 190 px previews, a 90% spread (225 px
between cards, clamped to the available space), 8° rotation, a 64 px entrance
lift from 0.95 scale, and 250 ms image motion with 35 ms stagger. Images have
white backgrounds and 1 px borders at 10% black. There is no individual-image
hover scaling. The prototype route was removed after promoting these settings.

## Explorations

The homepage's Explorations section lives in `src/lib/explorations/`, below
selected work. Its category buttons preview on hover and lock on click; cards
retain their size and left-to-right order when gathered. Opening a card scatters
its neighbours and plays the full-size loop in a lightbox. Phones use a filtered
two-column grid; reduced motion emphasizes categories without rearranging cards.

Add work in `src/lib/explorations/explorations.js`. Each entry needs a category,
title, dimensions, preview video (`src`), full-size video (`full`), and poster.
An optional `spot` sets the resting composition; entries without it auto-pack.
Keep the corresponding media in `static/explorations/`. The four pin spritesheets
are pre-rendered assets, so the pinboard does not load Three.js.

Prototype routes and render tools were removed when the section was promoted.
The pre-cleanup version is preserved in commit `880db28` on
`dev/finalize-explorations`.
