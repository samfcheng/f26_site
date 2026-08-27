import { getContext, setContext } from 'svelte';
import { moveMs, motion } from './motion.svelte.js';
import { slides } from './slides/index.js';

const DECK_KEY = Symbol('deck');


/**
 * Shared deck state: which slide is active, which parents are collapsed,
 * and a registry of card elements so anything can scroll to a slide.
 *
 * @param {import('./slides/index.js').Slide[]} slides
 */
export function createDeck(slides) {
	// Parents start collapsed.
	/** @type {Record<string, boolean>} */
	const collapsedMap = $state(
		Object.fromEntries(slides.filter((s) => s.children?.length).map((s) => [s.id, true]))
	);

	let activeId = $state(slides[0].id);

	// True while a collapse is animating and the rows are still moving. Anything
	// positioned against a row has to keep re-measuring until this clears.
	let settling = $state(false);

	// Whether the top of the deck is still clear of the floating chrome. The
	// Present button sits over the deck, so it gets out of the way as the first
	// slide comes up to meet it. Reported by the deck, which owns the scroller.
	let topClear = $state(true);

	/** @type {Map<string, HTMLElement>} */
	const cards = new Map();

	/** @type {Map<string, any>} */
	const byId = new Map();
	/** Flat 1..n numbering in deck order — a sub-slide is just the next slide. */
	/** @type {Map<string, number>} */
	const numbers = new Map();
	let n = 0;
	for (const slide of slides) {
		byId.set(slide.id, slide);
		numbers.set(slide.id, ++n);
		for (const child of slide.children ?? []) {
			byId.set(child.id, child);
			numbers.set(child.id, ++n);
		}
	}

	/** @type {HTMLElement | undefined} */
	let scroller;

	// Toggling again before the last collapse has finished starts a second hold
	// loop. Both would pin their own anchor and fight over `scrollTop`, and the
	// first to reach its deadline would clear `settling` while the rows are
	// still moving — which strands anything positioned against a row, like the
	// sidebar's selection block, wherever it happened to be. Each loop carries
	// the token it started with and gives way to any later one.
	let holdToken = 0;

	// While a programmatic scroll is in flight the active slide is pinned to its
	// target, so the sidebar highlight doesn't flicker through everything on the way.
	let locked = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let unlockTimer;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let revealTimer;

	function unlock() {
		locked = false;
		clearTimeout(unlockTimer);
		scroller?.removeEventListener('scrollend', unlock);
	}

	const visible = $derived.by(() => {
		/** @type {{ slide: any, depth: number }[]} */
		const flat = [];
		for (const slide of slides) {
			flat.push({ slide, depth: 0 });
			if (slide.children && !collapsedMap[slide.id]) {
				for (const child of slide.children) flat.push({ slide: child, depth: 1 });
			}
		}
		return flat;
	});

	const deck = {
		slides,

		/** @param {string} id */
		numberOf(id) {
			return numbers.get(id) ?? 0;
		},

		get activeId() {
			return activeId;
		},

		get settling() {
			return settling;
		},

		/** False once the first slide has reached the floating chrome. */
		get topClear() {
			return topClear;
		},

		/** @param {boolean} clear */
		setTopClear(clear) {
			topClear = clear;
		},

		/** Set from an intersection observer — ignored while a scroll is in flight. */
		observed(id) {
			if (!locked) activeId = id;
		},

		/** Flattened list of slides currently in the scroll flow. */
		get visible() {
			return visible;
		},

		/** @param {string} id */
		isCollapsed(id) {
			return collapsedMap[id] === true;
		},

		/**
		 * Make a slide selectable: if it is tucked inside a collapsed group, open
		 * that group first. Used when coming back from a presentation.
		 * @param {string} id
		 */
		reveal(id) {
			for (const slide of slides) {
				if (slide.children?.some((/** @type {any} */ child) => child.id === id)) {
					collapsedMap[slide.id] = false;
				}
			}
			activeId = id;
		},

		/**
		 * Clicking a slide selects it; clicking the one that is already selected
		 * opens or closes its sub-slides.
		 *
		 * In the deck, a collapsed parent that is not yet selected used to take
		 * two clicks — one to travel to it, another to open it — which made the
		 * cursor's "Click to expand" a promise the first click did not keep. It
		 * now does both, in that order: come to the slide, let the reader
		 * arrive, then open. The wait is what keeps it legible as two things
		 * rather than a scroll and a reflow landing at once.
		 *
		 * The sidebar passes `expand: false`: a thumbnail click is a jump, not a
		 * click on the slide itself, so it only takes the selection there. The
		 * group still opens on a second click, the same as any selected parent.
		 *
		 * @param {string} id
		 * @param {{ expand?: boolean }} [options]
		 */
		activate(id, { expand = true } = {}) {
			clearTimeout(revealTimer);

			const hasChildren = Boolean(byId.get(id)?.children?.length);
			if (id === activeId && hasChildren) {
				deck.toggle(id);
				return;
			}

			deck.scrollTo(id);

			if (!expand || !hasChildren || !collapsedMap[id]) return;
			revealTimer = setTimeout(() => {
				// Anything the reader did in the meantime wins — another slide
				// selected, or this group opened some other way.
				if (activeId === id && collapsedMap[id]) deck.toggle(id);
			}, motion.expandDelayMs);
		},

		/**
		 * Collapse/expand a parent. The active card is pinned to its current
		 * position for the whole animation, so nothing jumps under the reader —
		 * the deck grows or shrinks around them.
		 * @param {string} id
		 */
		toggle(id) {
			clearTimeout(revealTimer);
			// A `scrollTo` may still have a `scrollend` pending — it fires about when
			// an expand triggered by `activate` begins, and would unlock the
			// selection halfway through the animation, letting the observer hand it
			// to whichever slide happened to be crossing the middle.
			scroller?.removeEventListener('scrollend', unlock);

			// Collapsing the group the reader is inside: hand the selection back to
			// the parent, and anchor on it instead of the slide about to disappear.
			const collapsing = !collapsedMap[id];
			const swallowsActive =
				collapsing && byId.get(id)?.children?.some((/** @type {any} */ c) => c.id === activeId);

			const anchor = cards.get(swallowsActive ? id : activeId);
			const top = anchor?.getBoundingClientRect().top;

			if (swallowsActive) activeId = id;
			collapsedMap[id] = !collapsedMap[id];

			locked = true;
			settling = true;
			clearTimeout(unlockTimer);
			const started = performance.now();
			const token = ++holdToken;

			const hold = () => {
				// A later toggle has taken over: leave `settling` alone — that run
				// owns it now, and clearing it here is exactly the stranding bug.
				if (token !== holdToken) return;

				if (anchor && top !== undefined && scroller) {
					const delta = anchor.getBoundingClientRect().top - top;
					if (delta) scroller.scrollTop += delta;
				}

				if (performance.now() - started < moveMs() + 80) {
					requestAnimationFrame(hold);
				} else {
					settling = false;
					unlock();
				}
			};
			requestAnimationFrame(hold);
		},

		/** @param {HTMLElement} el */
		setScroller(el) {
			scroller = el;
		},

		/**
		 * @param {string} id
		 * @param {HTMLElement} el
		 */
		register(id, el) {
			cards.set(id, el);
			return () => cards.delete(id);
		},

		/**
		 * @param {string} id
		 * @param {ScrollBehavior} [behavior]
		 */
		scrollTo(id, behavior = 'smooth') {
			const el = cards.get(id);
			if (!el) return false;

			activeId = id;
			locked = true;
			clearTimeout(unlockTimer);
			unlockTimer = setTimeout(unlock, 1200);
			scroller?.addEventListener('scrollend', unlock, { once: true });

			el.scrollIntoView({ block: 'center', behavior });
			return true;
		},

		/**
		 * Move to the next/previous slide in the visible flow.
		 * @param {1 | -1} direction
		 */
		step(direction) {
			const list = visible;
			const index = list.findIndex((entry) => entry.slide.id === activeId);
			const next = list[Math.min(Math.max(index + direction, 0), list.length - 1)];
			if (next && next.slide.id !== activeId) deck.scrollTo(next.slide.id);
		}
	};

	return deck;
}

/**
 * One deck for the whole session. Module state, so leaving for a presentation
 * and coming back doesn't reset which slides are open or where you were.
 */
export const deck = createDeck(slides);

/** @param {ReturnType<typeof createDeck>} deck */
export function setDeck(deck) {
	return setContext(DECK_KEY, deck);
}

/** @returns {ReturnType<typeof createDeck>} */
export function getDeck() {
	return getContext(DECK_KEY);
}
