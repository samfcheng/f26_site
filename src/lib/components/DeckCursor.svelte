<script>
	import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down';
	import IconArrowUp from '@tabler/icons-svelte/icons/arrow-up';
	import IconExternalLink from '@tabler/icons-svelte/icons/external-link';
	import { untrack } from 'svelte';

	import { getDeck } from '$lib/deck.svelte.js';
	import {
		cursorEase,
		cursorMs,
		cursorOpenMs,
		cursorRollMs,
		cursorTilt,
		easing,
		motion
	} from '$lib/motion.svelte.js';

	/**
	 * The deck's pointer. Over a collapsed group it replaces the cursor with a
	 * pill saying what a click will do; over a link it names the destination.
	 *
	 * It replaces the cursor rather than sitting beside it because the thing
	 * being pointed at is a whole slide — there is no small target to keep in
	 * view, so an arrow on top of the label is just two cursors. That is also
	 * why it opens out of a dot: the dot is where the cursor was, so the label
	 * grows out of the point it is talking about instead of arriving beside it.
	 *
	 * One mechanism drives both halves of that. The pill's width is a number,
	 * measured off the label, and everything is a move along it: the dot is that
	 * width at 9px, opening is the same width transition running to the measured
	 * one, and a label changing under the pointer is that transition retargeting
	 * mid-flight. Nothing here switches modes, which is what keeps a swap from
	 * reading as a different animation than an open.
	 *
	 * The label is state and the position is not. A pointer that re-rendered on
	 * every move would put a Svelte update between the mouse and the pill, and
	 * the lag is visible — the transform is written straight to the element.
	 */
	let { scroller, active = $bindable(false) } = $props();

	const deck = getDeck();

	// All tunable at /prototype. The icon is sized against the label rather than
	// set independently, so the glyph reads as a word in the sentence and not as
	// a button stuck on the end.
	const DOT = $derived(motion.cursorDot);
	const PAD = $derived(motion.cursorPad);
	const HEIGHT = $derived(motion.cursorHeight);
	const ICON = $derived(motion.cursorIcon);

	/** @typedef {{ label: string, icon: 'expand' | 'collapse' | 'external' }} Cue */

	/** What the pointer is over now — null closes the pill. */
	let cue = $state(/** @type {Cue | null} */ (null));
	/** What is drawn. Held through the close so the pill collapses with its
	    label intact instead of emptying out first. */
	let held = $state(/** @type {Cue | null} */ (null));

	/** @type {HTMLElement | undefined} */
	let el = $state();
	/** @type {HTMLElement | undefined} */
	let pill = $state();
	/** @type {HTMLElement | undefined} */
	let sizer = $state();
	/** Natural width of the label, measured off a hidden copy at full size. */
	let natural = $state(0);

	function measure() {
		if (sizer) natural = sizer.getBoundingClientRect().width;
	}

	// Measured here rather than with `bind:clientWidth`, which reports through a
	// ResizeObserver — that fires after the frame is painted, so the first frame
	// of an open aimed at the *previous* label's width and then corrected itself
	// mid-animation. This effect runs after the label is in the DOM and before
	// the browser paints, so the pill knows how wide it is going before it starts.
	$effect(() => {
		held;
		measure();
	});

	// The labels are measured in a webfont that may not have arrived yet. One
	// re-measure when it does, so a pill sized against the fallback corrects
	// itself while it is closed rather than on the next open.
	$effect(() => {
		document.fonts?.ready.then(measure);
	});

	const shown = $derived(Boolean(cue));
	const width = $derived(shown && natural ? Math.max(natural + PAD * 2, HEIGHT) : DOT);

	// Reported back to the deck, which hides the real cursor while it is set.
	$effect(() => {
		active = shown;
	});

	// Where the pointer is, and where the pill has got to. Two pairs, because the
	// pill is eased toward the pointer rather than pinned to it.
	let tx = 0;
	let ty = 0;
	let px = 0;
	let py = 0;

	let inside = false;
	let frame = 0;
	let last = 0;

	/** Degrees of lean, and how far past that it will not go. */
	let angle = 0;
	const MAX_TILT = 10;
	/** How fast the lean answers a change in speed. Slower than the position
	    smoothing on purpose — the tilt should read as weight, and weight settles
	    after the thing carrying it has stopped. */
	const TILT_EASE = 0.18;

	function draw() {
		if (el) el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
		if (pill) {
			// On the pill, not on `.cursor`. CSS applies `translate` then `rotate`
			// then `transform`, all about one origin — so the pill turns about its
			// own centre and is then offset by its own half-size, which is where the
			// pointer is. Turning `.cursor` instead would swing the pill around a
			// point half a pill away from it.
			pill.style.rotate = `${angle.toFixed(2)}deg`;
			pill.style.transform = `skewX(${(angle * motion.cursorSkew).toFixed(2)}deg)`;
		}
	}

	/**
	 * Exponential smoothing toward the pointer. `cursorEase` is a fraction per
	 * 60fps frame, re-based here on the real frame time — a plain
	 * `p += (t - p) * k` covers twice the distance per second on a 120Hz display,
	 * so the trail would be half as long on better hardware.
	 *
	 * @param {number} now
	 */
	function step(now) {
		const dt = last ? Math.min(now - last, 64) : 16.667;
		last = now;

		const k = 1 - Math.pow(1 - cursorEase(), dt / 16.667);
		const was = px;
		px += (tx - px) * k;
		py += (ty - py) * k;

		// Banked off the pill's own velocity rather than the pointer's, so the
		// lean is a property of the thing that is moving and inherits the same
		// smoothing — reading the raw pointer here makes the chip twitch on every
		// stray sample. Normalised to px per 60fps frame so the lean is the same
		// at any refresh rate, like the position smoothing above.
		const vx = ((px - was) * 16.667) / dt;
		const want = Math.max(-MAX_TILT, Math.min(MAX_TILT, vx * cursorTilt()));
		angle += (want - angle) * (1 - Math.pow(1 - TILT_EASE, dt / 16.667));

		// Settled: snap off the last sub-pixel and stop, rather than easing
		// forever toward a target that has stopped moving. The lean has to be
		// level before that counts, or the chip freezes mid-bank.
		if (Math.abs(tx - px) < 0.05 && Math.abs(ty - py) < 0.05 && Math.abs(angle) < 0.02) {
			px = tx;
			py = ty;
			angle = 0;
			draw();
			frame = 0;
			last = 0;
			return;
		}

		draw();
		frame = requestAnimationFrame(step);
	}

	function follow() {
		if (frame) return;
		last = 0;
		frame = requestAnimationFrame(step);
	}

	/**
	 * What a link is called: the site it goes to, or the address it writes to.
	 * @param {string} href
	 * @returns {Cue}
	 */
	function destination(href) {
		if (href.startsWith('mailto:')) return { label: href.slice(7), icon: 'external' };
		try {
			return { label: new URL(href).hostname.replace(/^www\./, ''), icon: 'external' };
		} catch {
			return { label: href, icon: 'external' };
		}
	}

	/**
	 * @param {Element | null} target
	 * @returns {Cue | null}
	 */
	function cueFor(target) {
		if (!target) return null;

		// Slide links are `role="link"` spans, not anchors — see the note in
		// WorkCover — so the destination is read off `data-href`.
		const link = target.closest('[data-href]');
		const href = link?.getAttribute('data-href');
		if (href) return destination(href);

		// A group reads its own state back: the pill says which way the click goes
		// rather than disappearing at the moment it was acted on.
		const card = target.closest('.card.parent');
		if (!card) return null;
		const id = card.id.replace(/^slide-/, '');
		return deck.isCollapsed(id)
			? { label: 'Click to expand', icon: 'expand' }
			: { label: 'Click to collapse', icon: 'collapse' };
	}

	// How long the incoming label waits. Opening, it holds until there is a pill
	// to arrive into; swapping, the pill is already there and a long wait is a
	// stall. Read when the transition is built, which is the render `setCue`
	// triggers on the line after it sets this.
	let rollDelay = $state(0);
	/** Bumped for every open and every change — see `setCue`. */
	let rollKey = $state(0);
	/** Which of the two label animations this render is. */
	let rollMode = $state(/** @type {'grow' | 'roll'} */ ('grow'));

	/**
	 * The one way `cue` is written.
	 *
	 * `cue` is read here to decide whether this is an open, and written on the
	 * next line — which is harmless from an event handler and was not harmless
	 * from the `$effect` below, where the read registered as a dependency of the
	 * effect doing the write. `cueFor` builds a fresh object every call, so the
	 * new value never compared equal to the old one and the effect re-triggered
	 * itself forever: the deck locked up on the click that expands a group, and
	 * would not collapse it again. `untrack` keeps the read out of the graph, and
	 * the equality check above means an unchanged cue writes nothing at all.
	 *
	 * @param {Cue | null} next
	 */
	function setCue(next) {
		const prev = untrack(() => cue);
		if (next?.label === prev?.label && next?.icon === prev?.icon) return;

		const opening = Boolean(next) && !prev;

		// Opening: put the dot under the pointer before it is visible. Easing in
		// from wherever the pill was last would fly it across the deck to get here.
		if (opening) {
			px = tx;
			py = ty;
			draw();
		}

		// Swapping, the width still needs a frame to be re-measured — leading the
		// text by a hair lets the pill start resizing first, so the incoming
		// label arrives into a pill that already fits it.
		// Opening, the label has no roll of its own — `.scaler` carries it, on the
		// pill's clock, so the two are one motion. Swapping, the incoming label
		// waits the single frame its new width is measured in, so it arrives into
		// a pill that already fits it.
		rollMode = opening ? 'grow' : 'roll';
		rollDelay = opening ? 0 : Math.round(cursorRollMs() * 0.15);
		cue = next;
		// `held` outlives the close so the pill collapses with its label intact,
		// which means re-opening on the same slide produces the same label — and
		// keying the roll on the label alone left that open with no transition at
		// all, the text sitting at full size while the pill grew around it. The
		// key counts openings instead. Nothing is bumped on close: the label has
		// to stay put while it collapses.
		if (next) {
			held = next;
			rollKey++;
		}
	}

	/** @param {PointerEvent} event */
	function onpointermove(event) {
		// Touch has no hover, and a pill chasing a finger it is already under is
		// noise. The cue is a pointer affordance or nothing.
		if (event.pointerType !== 'mouse') return;
		inside = true;
		tx = event.clientX;
		ty = event.clientY;
		setCue(cueFor(/** @type {Element} */ (event.target)));
		follow();
	}

	function clear() {
		inside = false;
		cue = null;
	}

	/**
	 * Re-read the cue against whatever is under the pointer now, at most once a
	 * frame. `elementFromPoint` forces a layout, and the things that call this
	 * fire per frame — a toggle writes `scrollTop` on every frame of its
	 * animation, and each write is a scroll event.
	 */
	let hit = 0;
	function retest() {
		if (hit || !inside) return;
		hit = requestAnimationFrame(() => {
			hit = 0;
			if (inside) setCue(cueFor(document.elementFromPoint(tx, ty)));
		});
	}

	// Scrolling moves slides out from under a pointer that never moved, so the
	// cue goes stale without anything having changed about the pointer —
	// otherwise the pill keeps offering to expand a group that has scrolled away.
	// Same staleness on a click, for the opposite reason: acting on the pill is
	// what makes it wrong, and nothing else would re-read it until the pointer
	// moved again. The hit test runs before the cards have travelled, which is
	// what we want — the answer is about the group's state, not where it has
	// got to.
	$effect(() => {
		deck.visible;
		retest();
	});

	// Bound to the scroller rather than declared on the markup below: the pill is
	// `pointer-events: none`, so it can't be the thing that hears the move.
	$effect(() => {
		if (!scroller) return;
		scroller.addEventListener('pointermove', onpointermove);
		scroller.addEventListener('pointerleave', clear);
		scroller.addEventListener('scroll', retest, { passive: true });
		return () => {
			scroller.removeEventListener('pointermove', onpointermove);
			scroller.removeEventListener('pointerleave', clear);
			scroller.removeEventListener('scroll', retest);
		};
	});

	$effect(() => () => {
		cancelAnimationFrame(frame);
		cancelAnimationFrame(hit);
	});

	/**
	 * One label leaving upward as its replacement comes up from below — the one
	 * case where a direction means something, because something is being
	 * replaced. Opening is not this: the words are already the words, they are
	 * just not full size yet, and that is `.scaler` below rather than a
	 * transition, so it can run backwards on the close.
	 *
	 * Written out rather than composed from `fly` and `scale` because two Svelte
	 * transitions on one element fight over `transform`.
	 *
	 * @param {Element} node
	 * @param {{ y: number, duration: number, delay?: number }} opts
	 */
	function roll(node, { y, duration, delay = 0 }) {
		return {
			delay,
			duration,
			easing: easing(),
			/** @param {number} t @param {number} u */
			css: (t, u) => `transform: translateY(${u * y}px) scale(${0.85 + 0.15 * t}); opacity: ${t}`
		};
	}

	// Width and height run on one timing and one curve. Height used to finish at
	// 45% of the width's duration, on the theory that reaching full height first
	// reads as a pill inflating — but the instant it landed while the width
	// carried on was a corner in the motion, the shape opening in two directions
	// and then in one. There was never a blob to avoid: the ends stay fully
	// rounded at every size, so the pill is a pill the whole way out.
	//
	// Nothing waits, either. An earlier pass held the shape back 54ms so the dot
	// could register as a dot, and that pause was most of what felt clunky. The
	// dot registers because it is where the pill starts, not because it stalls.
	//
	// Closing runs at one shorter timing: the pointer has already left, and a
	// slow collapse is just something in the way.
	// Closing is the opening backwards, written as one set of fractions read in
	// both directions rather than two specs that have to be kept in step by hand.
	// Shape takes the whole duration; opacity takes the first 80% of an opening
	// and, mirrored, the last 80% of a close — so the dot is solid before it
	// starts to grow and still solid until it has almost finished shrinking.
	// With `cursorMs` and `cursorOpenMs` equal, in and out are the same animation.
	const span = $derived(shown ? cursorOpenMs() : cursorMs());
	const fade = $derived(
		`opacity ${Math.round(span * 0.8)}ms ${motion.cursorEasing} ${shown ? 0 : Math.round(span * 0.2)}ms`
	);
	const shapeT = $derived(
		`width ${span}ms ${motion.cursorEasing}, height ${span}ms ${motion.cursorEasing}, ${fade}`
	);
	/** The label's own half of that: it grows and shrinks with the pill. */
	const scaleT = $derived(`transform ${span}ms ${motion.cursorEasing}, ${fade}`);
	/** How small the words are when the pill is a dot. */
	const SHRINK = 0.6;
</script>

<!-- The label and its glyph, rendered twice: once in the pill and once in the
     hidden copy that is measured to find the width the pill opens to. -->
{#snippet content(c)}
	{c.label}
	{#if c.icon === 'external'}
		<IconExternalLink size={ICON} stroke={1.75} />
	{:else if c.icon === 'expand'}
		<IconArrowDown size={ICON} stroke={1.75} />
	{:else}
		<IconArrowUp size={ICON} stroke={1.75} />
	{/if}
{/snippet}

<svelte:window onblur={clear} />

<div
	bind:this={el}
	class="cursor"
	class:shown
	style:--cursor-font="{motion.cursorFont}px"
	aria-hidden="true"
>
	<div bind:this={pill} class="pill" style:width="{width}px" style:height="{shown ? HEIGHT : DOT}px" style:transition={shapeT}>
		<!-- Clips the roll: a label leaving upward has to go out of the pill, not
		     over its edge. -->
		<div class="roll">
			<!-- The span sits directly in the `{#key}`, not inside an `{#if}`. A
			     transition is local by default and does not play when the block being
			     destroyed is an ancestor of the one it belongs to — nested one deeper,
			     the roll simply never ran on a label change.

			     An opening has an outgoing label too: the last one, held through the
			     close so the pill could collapse with it. It gets no time at all,
			     because a label leaving while its identical replacement grows in is
			     just the same words twice. -->
			<div
				class="scaler"
				style:transform="scale({shown ? 1 : SHRINK})"
				style:opacity={shown ? 1 : 0}
				style:transition={scaleT}
			>
				{#key rollKey}
					<span
						class="label"
						in:roll={{
							y: 14,
							duration: rollMode === 'roll' ? cursorRollMs() : 0,
							delay: rollDelay
						}}
						out:roll={{
							y: -14,
							duration: rollMode === 'roll' ? Math.round(cursorRollMs() * 0.7) : 0
						}}
					>
						{#if held}{@render content(held)}{/if}
					</span>
				{/key}
			</div>
		</div>
	</div>

	<!-- The width the pill is aiming for. Measured off a full-size copy rather
	     than computed, so it is whatever the font actually renders — and kept out
	     of the pill so measuring it is never affected by the pill's own size. -->
	<span class="sizer" bind:this={sizer}>
		{#if held}{@render content(held)}{/if}
	</span>
</div>

<style>
	/* The positioned layer, and nothing else — its transform belongs to the
	   script. `fixed` so it is in viewport coordinates like the pointer events
	   that drive it, and `pointer-events: none` so it never becomes the target
	   of the move that placed it. */
	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 40;
		pointer-events: none;
		will-change: transform;
		/* Placed by script, but a value is needed before the first frame or the
		   dot flashes at the origin. */
		transform: translate3d(-100vw, -100vh, 0);
	}

	/* Centring is its own property so the script's transform can stay a bare
	   translate. It resolves against the pill's *current* width, so the pill
	   opens symmetrically around the point rather than growing off to one side. */
	.pill {
		translate: -50% -50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: var(--surface);
		color: var(--fg);
		font-size: var(--cursor-font);
		line-height: 1;
		white-space: nowrap;
		/* The label is taller than the dot the pill collapses into, so the pill
		   has to clip it. `overflow` clips descendants only — the pill's own
		   shadow survives, which is exactly why the shadow is back to a
		   `box-shadow` now that no `clip-path` is cutting the element itself. */
		overflow: hidden;
		box-shadow:
			0 0 0 1px var(--line),
			0 2px 8px -2px rgb(0 0 0 / 0.12);
		opacity: 0;
	}

	.cursor.shown .pill {
		opacity: 1;
	}

	.roll {
		position: relative;
		width: 100%;
		height: 18px;
		overflow: hidden;
	}

	/* Persists across label changes, which is what lets it carry the open and the
	   close: a Svelte transition only exists while an element is being created or
	   destroyed, and on a close nothing is — the label is the same label, held so
	   the pill can collapse with it. Scaling here instead means the close is the
	   open played backwards, on the same curve, for free. */
	.scaler {
		position: absolute;
		inset: 0;
	}

	/* Absolute so the outgoing and incoming labels occupy the same place and
	   cross rather than queue. */
	.label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}

	/* The label is pinned to the pill's width, so while the pill is still opening
	   its content does not fit and flex looks for something to take the
	   difference out of. The text has a floor — `nowrap` gives it a min-content
	   width it cannot go under — and an SVG, being a replaced element, has none,
	   so the icon was absorbing the entire squeeze and shrinking on a curve of
	   its own. Both halves of the label are scaled by the transition and by
	   nothing else. */
	.label :global(svg) {
		flex: none;
	}

	/* Laid out, so it has a width; never painted. */
	.sizer {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: var(--cursor-font);
		line-height: 1;
		white-space: nowrap;
		visibility: hidden;
	}
</style>
