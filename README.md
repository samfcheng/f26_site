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

- `src/routes/+page.svelte`: hero and footer layout.
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
simpler simulation. Mobile-specific layout is intentionally deferred.

Original project imagery remains in `static/work` for future case studies.

The hero fills the viewport height. Typography uses fixed pixel sizes (1 rem hero
copy, 48 px section headings, 16 px project/footer copy); only the oversized hero
name scales with viewport width. Project order is Multiply, Classmate, Olos.

The selected Fan treatment uses 250 × 190 px previews, a 90% spread (225 px
between cards, clamped to the available space), 8° rotation, a 64 px entrance
lift from 0.95 scale, and 250 ms image motion with 35 ms stagger. Images have
white backgrounds and 1 px borders at 10% black. There is no individual-image
hover scaling. The prototype route was removed after promoting these settings.

## Desk work-page study

`/prototypes/work-desk` is an isolated, single-scene prototype based on the desk
sketch: an aluminum monitor, notepad and pen, and coffee on a cool gray desk.
It shares the badge's plotter shader and default settings. The monitor texture
contains the project bento layout, with projected HTML links for keyboard access
and case-study navigation. A damped perspective camera responds to mouse movement. A four-corner CSS
projection keeps links aligned with the tilted screen. Rendering stops when
settled, offscreen, or in a hidden tab, and reuses static shadow maps. The Work
marquee uses CSS; reduced motion disables the marquee and camera movement.
The section has no surrounding header, footer, or visible controls. Geometry, textures,
shadow maps, render targets, and observers are released on navigation.
