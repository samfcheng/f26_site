# Open questions

State as of the last session. Content gaps first, since they block nothing
technical but do block shipping.

## Content still missing

Marked `TODO` in the source.

- **`ClassmateDetailSlide` and `OlosDetailSlide`** — `Team` and `Goal` are
  placeholders for both. `When`, `Role` and `Skills` were carried over from the
  original placeholder slides and have never been confirmed.
- **Both detail slides use Multiply's screenshots** as a stand-in strip. They
  need their own exports. `MultiplyDetailSlide` is the one to copy the shape of.

## Design calls waiting on a decision

**The stack notch.** On a dark cover, the pane shows through in two 5px notches
either side of the sliver, because `stackTransform` steps a stacked card *in* by
exactly as much as it steps *down*. That is the documented design working
correctly — it only reads as a defect on black, where the pane behind is bright.
Two one-line options, neither taken:

- Decouple the two: keep the 5px vertical peek, drop the horizontal inset to
  ~2px. Shrinks the notch, keeps the "steps back" cue.
- Drop the horizontal inset entirely: sliver spans the full width, no notch,
  stack reads as pure vertical layering.

## Verification that could not be done here

- **GPU compositing cost of the dissolve.** 18 painting `backdrop-filter` layers
  in the deck. Headless Chrome uses software rendering, so any number measured
  here would be meaningless. Needs a look on real hardware while scrolling and
  while collapsing a group. The fallback if it janks is in
  [decisions.md](decisions.md#the-blur-is-six-backdrop-filter-layers).

## Known rough edges

- **Classmate's cover image is upscaled ~1.31×** (1400px source drawn at 1840).
  It matches the mock, which did the same, but a larger export would be sharper.
- **`ContactSlide` is the only slide with real interactive links.** Its chips
  assume `instagram.com/samfcheng`, `x.com/samfcheng`,
  `linkedin.com/in/samfcheng`. Unverified.
- **Images are 626 KB of a 787 KB production payload**, and ~40% of that is the
  five Multiply screenshots — which only matter once a group is expanded.
  Deferring collapsed sub-slides' imagery is the real lever, but it needs the
  sidebar to stop rendering them eagerly.

## Things that would need care if the deck grows

- Past ~30 slides, virtualize the sidebar list before anything else. See
  [decisions.md](decisions.md#thumbnails-are-not-pre-rendered-at-build-time).
- `motion.maxStack` caps visible slivers at 2. Every project currently has
  exactly **one** sub-slide, so no stack has ever shown more than one sliver —
  the multi-sliver case is essentially untested.
