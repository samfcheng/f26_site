# Presenting

## Starting a show

The play button floats over the top-right of the deck and steps out of the way —
up and out, not just fading — as the first slide rises to meet it, ~20px before
the two would touch. `Deck.svelte` measures the gap and reports it as
`deck.topClear`. An open menu stays put: pulling the popover out from under the
pointer mid-choice is worse than letting it overlap a slide for a moment.

Two ways to start:

- **Presentation** (`⌥⌘↵`) — `/present`. The slide is letterboxed in black at
  whatever size fits.
- **Presentation with notes** (`⌥⇧⌘↵`) — the same show, plus a separate window
  (`popup=yes`, so the browser detaches it rather than opening a tab) at
  `/present/notes`, with the deck on the left and speaker notes on the right.

Both must be called from a user gesture — the popup and the fullscreen request
each depend on it.

## The show

Any pointer movement brings the chrome back; it leaves again, along with the
cursor, once the pointer settles for 2.5s. Click or arrow to advance.

The chrome is the same floating white surface as the rest of the app rather than
a dark scrim, so it stays legible over a black letterbox bar and a white slide
alike. Two chips at the top centre:

- **Esc** — leave the show. You come back to the editor on the slide you
  finished on, with its group opened if it was collapsed.
- **Minimize / maximize** — leave or re-enter fullscreen *without* ending the
  show. A toggle rather than minimize-only, because minimize-only leaves you
  windowed with no way back.

And the slide counter at the bottom.

### Escape needs the fullscreen event, not the keydown

**In fullscreen the browser eats the Escape keydown.** It handles the key itself
to drop fullscreen and never delivers the event to the page, so a plain
`keydown` handler never runs — which is how the show used to end up quietly
windowed at `/present` instead of returning to the editor.

The fullscreen exit is the only signal there is, so that is what `/present`
listens to. A `fullscreenchange` that drops fullscreen **and that we did not ask
for** is Escape, and it ends the show. Two flags keep it honest:

- `ours` — set while we are the ones changing fullscreen, so the minimize button
  is not mistaken for Escape.
- `leaving` — guards the recursion, because `exitPresentation()` itself exits
  fullscreen and lands right back in the same listener.

When *not* fullscreen the keydown does arrive, and the normal handler takes it.

Four paths, all of which should keep working:

| action | expected |
| --- | --- |
| enter fullscreen | chip flips to "Leave full screen" |
| click minimize | exits fullscreen, **stays** in the show |
| browser drops fullscreen (Escape) | back to `/` |
| Escape keydown while windowed | back to `/` |

Headless Chrome has no real fullscreen, so to test this you stub
`document.fullscreenElement`, `requestFullscreen` and `exitFullscreen` and
dispatch `fullscreenchange` yourself.

## Two windows, one show

The stage and the presenter window stay in step over a `BroadcastChannel`.
Either can drive. Ending the show closes the presenter window.

The join protocol is in `src/lib/present-channel.js`, deliberately kept apart
from the reactive state so it can be tested without a browser. One rule holds it
together:

> **A window that has just opened asks where the show is. It never announces a
> position of its own.**

The presenter window starts at slide 1 like any other document, so announcing
that on join would drag a running show back to the beginning. Only the stage
(`connect({ stage: true })`) announces, and only it answers `hello`. Once the
show is running either window may move it, because a `go()` is a deliberate move
rather than a stale opinion.

`present-channel.test.js` pins that down — it fails if a joining window starts
announcing again. It is the one part of this app with real unit tests, and it
earned them.

## Files

- `src/lib/present.svelte.js` — state, channel wiring, entry points.
- `src/lib/present-channel.js` — the join protocol, browser-free.
- `src/lib/components/present/` — `PresentButton`, `PresentPopover`,
  `PresentMenuList`, `PresentStage`, `PresentBar`, `SlideCounter`.
- `src/routes/present/+page.svelte` — the stage, and the fullscreen lifecycle.
- `src/routes/present/notes/+page.svelte` — the presenter window.

Notes live on the slide definitions in `src/lib/slides/index.js`.
