import { MediaQuery } from 'svelte/reactivity';

const reduce = new MediaQuery('(prefers-reduced-motion: reduce)', false);

/** Strong curves — the built-in CSS easings are too weak for UI. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
/** easeOutBack — overshoots, for the hover nudge only. */
export const EASE_BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

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

	/** How many sub-slides are visible in a collapsed stack. */
	maxStack: 2,
	/** Sliver of each stacked slide. Also its horizontal inset, so a stacked
	    slide steps in by exactly as much as it steps down. */
	deckPeek: 5,
	thumbPeek: 5,

	/** Hovering a collapsed slide holds its stack out. */
	hoverLift: 2,
	hoverMs: 200
};

/** Live, tweakable at /prototype. */
export const motion = $state({ ...DEFAULTS });

export function resetMotion() {
	Object.assign(motion, DEFAULTS);
}

// Reduced motion drops movement but keeps the fades that carry meaning.
export function moveMs() {
	return reduce.current ? 0 : motion.moveMs;
}

export function staggerMs() {
	return reduce.current ? 0 : motion.staggerMs;
}

export function selectMs() {
	return reduce.current ? 0 : motion.selectMs;
}

export function hoverMs() {
	return reduce.current ? 0 : motion.hoverMs;
}

/**
 * How far a stacked slide steps out while its parent is hovered. Zero on
 * touch, where every tap would fire a phantom hover.
 * @param {number} depth  clamped position in the stack
 */
export function hoverOffset(depth) {
	if (!hoverable.current || reduce.current) return 0;
	return motion.hoverLift * (depth + 1);
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
