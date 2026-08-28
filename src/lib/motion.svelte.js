import { MediaQuery } from 'svelte/reactivity';

const reduce = new MediaQuery('(prefers-reduced-motion: reduce)', false);

/** Strong curves — the built-in CSS easings are too weak for UI. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
/** easeOutBack — overshoots, for the hover nudge only. */
export const EASE_BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
/**
 * easeOutCubic, for a shape you are meant to watch change.
 *
 * `EASE_OUT` is an expo curve: 84% travelled at 30% of its duration. That is
 * right for an entrance, which should feel like it has already happened, and
 * wrong for a morph — it puts every frame you can actually see into the first
 * sixth of the animation and spends the rest settling invisibly, so the motion
 * reads as a lurch no matter how long the duration is set to. This spends about
 * nine frames on the visible middle where `EASE_OUT` spends six.
 */
export const EASE_MORPH = 'cubic-bezier(0.33, 1, 0.68, 1)';

const hoverable = new MediaQuery('(hover: hover) and (pointer: fine)', false);

export const DEFAULTS = {
	/** Sub-slides travelling between the stack and their expanded position. */
	moveMs: 300,
	/** Per-sub-slide delay so they don't all leave the stack at once. */
	staggerMs: 20,
	/** The selection block sliding to the newly selected row. */
	selectMs: 300,
	/** Slide numbers fading as they arrive. */
	fadeMs: 200,
	/** How long the numbers wait before fading in, so they land with the slide. */
	fadeDelayMs: 90,
	/** 'travel' rides with the slide, 'delay' fades in place, 'fade' is immediate. */
	numberMode: 'travel',

	/** The curve the deck's peek runs on — sub-slides travelling out of a stack,
	    the group's height opening behind them, the wash and the hover nudge. Held
	    as the CSS string rather than the `EASE_OUT` constant so /prototype can
	    swap it. Both panes read it, so the deck and the sidebar stay in step. */
	deckEasing: 'cubic-bezier(0.23, 1, 0.32, 1)',
	/** Everything the peek animates, multiplied. For watching it back a frame at
	    a time; 1 in anything but /prototype. */
	deckTimeScale: 1,

	/** The pause between arriving at a collapsed group and it opening, when one
	    click has to do both. Long enough to read as two steps. */
	expandDelayMs: 750,

	/** How many sub-slides are visible in a collapsed stack. */
	maxStack: 2,
	/** Sliver of each stacked slide. Also its horizontal inset, so a stacked
	    slide steps in by exactly as much as it steps down. Two knobs because
	    these are pixels, not ratios: 5px under a 200px thumbnail is a visible
	    step, and the same 5px under a 1000px card is a rounding error. */
	deckPeek: 12,
	thumbPeek: 5,

	/** How far each step down a collapsed stack washes toward mid-grey. */
	recede: 0.2,

	/** Hovering a collapsed slide holds its stack out. Split by pane for the same
	    reason as the peek — these are pixels, not ratios. */
	deckHoverLift: 5,
	thumbHoverLift: 2,
	/** How far a hovered thumbnail lightens. One wash, two amounts: the same
	    white does very different things to the two tones — it lifts a dark slide
	    bodily, where on a light one the ground barely moves and only the content
	    fades. Which is why these are matched by eye, at /prototype, not set to
	    one number. Keyed off the slide's `dark` flag. */
	thumbHoverWashLight: 0.2,
	thumbHoverWashDark: 0.1,
	/** In step with `moveMs`, so the peek on hover and the expand it previews
	    move at the same speed. */
	hoverMs: 300,
	/** The cursor cue's dot fading in, and the pill collapsing back into it. */
	cursorMs: 300,
	/** The pill's width opening out of the dot, and re-settling when the label
	    changes under it. The part you actually watch, so it gets the longest of
	    these — at the ceiling for a hover cue, not past it. Width and height share
	    it exactly. An earlier pass ran height at 45% so the pill would reach full
	    height first, and the moment it landed while the width carried on was a
	    visible kink: the shape grew in two directions, then in one. On `EASE_MORPH`,
	    not `EASE_OUT`. */
	cursorOpenMs: 300,
	/** One label leaving upward as the next arrives from below. */
	cursorRollMs: 260,
	/** How hard the pill is pulled toward the pointer each frame, 0–1. Below 1 it
	    trails a little, and that trail is the whole difference between a label
	    glued to the cursor and one that follows it. 1 is rigid. */
	cursorEase: 0.35,
	/** Degrees of lean per pixel-per-frame of travel, so the chip banks into a
	    move instead of sliding around flat. Negate it to tip the other way. */
	cursorTilt: 0.32,
	/** Skew as a fraction of the lean — the trailing end not keeping up. */
	cursorSkew: 0.4,

	/** The curve the pill's shape runs on, and with it the label's. Held as the
	    CSS string rather than a name so /prototype can hand it an arbitrary one;
	    `easing()` turns it into the matching JS function for the label. */
	cursorEasing: 'cubic-bezier(0.5, 1, 0.89, 1)',

	/** The cursor's own sizes, in px. Collapsed size first — that is the dot. */
	cursorDot: 9,
	/** Baked into the target width, so opening never animates a padding too. */
	cursorPad: 10,
	cursorHeight: 30,
	cursorFont: 14,
	cursorIcon: 13,

	/** Everything the cursor animates, multiplied. For watching it back a frame
	    at a time; 1 in anything but /prototype. */
	cursorTimeScale: 1
};

/** Named curves for /prototype's picker. Values from easing.dev. */
export const CURVES = {
	easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
	easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
	easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
	deckEaseOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
	easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)'
};

/**
 * The JS twin of a CSS `cubic-bezier(...)`, so the label's transition runs on
 * whatever curve the pill's does. Newton's method against the x polynomial,
 * which is what the browser does for the CSS side.
 *
 * @param {string} css
 * @returns {(t: number) => number}
 */
function solve(css) {
	const n = css.match(/-?[\d.]+/g)?.map(Number);
	if (!n || n.length < 4) return (t) => t;
	const [p1x, p1y, p2x, p2y] = n;
	const cx = 3 * p1x;
	const bx = 3 * (p2x - p1x) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * p1y;
	const by = 3 * (p2y - p1y) - cy;
	const ay = 1 - cy - by;
	return (X) => {
		let t = X;
		for (let i = 0; i < 8; i++) {
			const e = ((ax * t + bx) * t + cx) * t - X;
			if (Math.abs(e) < 1e-6) break;
			const d = (3 * ax * t + 2 * bx) * t + cx;
			if (Math.abs(d) < 1e-6) break;
			t -= e / d;
		}
		return ((ay * t + by) * t + cy) * t;
	};
}

/** @type {Map<string, (t: number) => number>} */
const solved = new Map();

/** The current cursor curve as a JS easing function. */
export function easing() {
	const css = motion.cursorEasing;
	let fn = solved.get(css);
	if (!fn) {
		fn = solve(css);
		solved.set(css, fn);
	}
	return fn;
}

/** Live, tweakable at /prototype. */
export const motion = $state({ ...DEFAULTS });

export function resetMotion() {
	Object.assign(motion, DEFAULTS);
}

// Reduced motion drops movement but keeps the fades that carry meaning.
export function moveMs() {
	return reduce.current ? 0 : Math.round(motion.moveMs * motion.deckTimeScale);
}

export function staggerMs() {
	return reduce.current ? 0 : Math.round(motion.staggerMs * motion.deckTimeScale);
}

export function selectMs() {
	return reduce.current ? 0 : Math.round(motion.selectMs * motion.deckTimeScale);
}

export function hoverMs() {
	return reduce.current ? 0 : Math.round(motion.hoverMs * motion.deckTimeScale);
}

export function cursorMs() {
	return reduce.current ? 0 : Math.round(motion.cursorMs * motion.cursorTimeScale);
}

export function cursorOpenMs() {
	return reduce.current ? 0 : Math.round(motion.cursorOpenMs * motion.cursorTimeScale);
}

export function cursorRollMs() {
	return reduce.current ? 0 : Math.round(motion.cursorRollMs * motion.cursorTimeScale);
}

/** 1 pins the pill to the pointer — the right answer for reduced motion, where
		a trailing element is the thing being asked for less of. */
export function cursorEase() {
	return reduce.current ? 1 : motion.cursorEase;
}

export function cursorTilt() {
	return reduce.current ? 0 : motion.cursorTilt;
}

/**
 * How far a stacked slide steps out while its parent is hovered. Zero on
 * touch, where every tap would fire a phantom hover.
 * @param {number} depth  clamped position in the stack
 * @param {number} lift   px per step — `deckHoverLift` or `thumbHoverLift`
 */
export function hoverOffset(depth, lift) {
	if (!hoverable.current || reduce.current) return 0;
	return lift * (depth + 1);
}

/**
 * Whether the pointer can hover at all. Hover cues driven from JS need the guard
 * a CSS `:hover` gets from a media query — on touch every tap fires a phantom
 * hover that then sticks. Not tied to reduced motion: these are states, not
 * movement, and `hoverMs` already flattens how they arrive.
 */
export function canHover() {
	return hoverable.current;
}

/**
 * Where a sub-slide sits when its group is collapsed: tucked behind the parent,
 * scaled down, with `peek` px showing below the parent's bottom edge. Depth is
 * clamped to `maxStack`, so a fourth sub-slide hides exactly behind the second
 * and still travels the full distance when the group opens.
 *
 * @param {number} index   position within the group
 * @param {number} size    height of one slide
 * @param {number} pitch   distance between consecutive slides (size + spacing)
 * @param {number} peek    visible sliver per stacked slide
 * @param {number} shrink  scale lost per stacked slide
 * @param {number} maxStack how many slivers are visible
 */
export function stackDepth(index, maxStack) {
	return Math.min(index, Math.max(maxStack, 1) - 1);
}

export function stackTransform(index, size, width, pitch, peek, maxStack) {
	const depth = stackDepth(index, maxStack);
	const inset = peek * (depth + 1);
	// Scale is derived from the peek rather than set independently, so the slide
	// steps in by the same number of pixels it steps down — at any slide size.
	const scale = width > 0 ? Math.max(0, 1 - (2 * inset) / width) : 1;
	// The `size * scale` term gives back the height lost to scaling from the top,
	// so the sliver below the parent is exactly `inset`.
	const offset = size + inset - size * scale - (index + 1) * pitch;
	return { transform: `translateY(${offset}px) scale(${scale})`, offset, depth };
}

/** Height of a collapsed group: just enough for the visible slivers. */
export function stackHeight(count, peek, maxStack) {
	return peek * Math.min(count, Math.max(maxStack, 1));
}
