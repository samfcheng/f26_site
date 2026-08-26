import { goto } from '$app/navigation';
import { deck } from './deck.svelte.js';
import { join } from './present-channel.js';
import { flatSlides } from './slides/index.js';

/** Where the show currently is. Shared by the stage and the presenter view. */
export const presentation = $state({ index: 0 });

/** @type {ReturnType<typeof join> | null} */
let link = null;

/**
 * Join the presentation channel. Returns a teardown for `$effect`.
 *
 * `stage` marks the window the show is running in — the one that knows where
 * the show is. Everyone else asks rather than announces; `present-channel.js`
 * has the reasoning.
 *
 * @param {{ onexit?: () => void, stage?: boolean }} [handlers]
 */
export function connect({ onexit, stage = false } = {}) {
	if (typeof BroadcastChannel === 'undefined') return () => {};

	link = join({
		stage,
		index: () => presentation.index,
		setIndex: (index) => (presentation.index = index),
		onexit
	});

	return () => {
		link?.close();
		link = null;
	};
}

/** @param {Record<string, unknown>} message */
function post(message) {
	link?.post(message);
}

export function slideAt(index) {
	return flatSlides[Math.min(Math.max(index, 0), flatSlides.length - 1)];
}

export const total = flatSlides.length;

/** @param {number} index */
export function go(index) {
	const next = Math.min(Math.max(index, 0), flatSlides.length - 1);
	if (next === presentation.index) return;
	presentation.index = next;
	post({ type: 'index', index: next });
}

export const next = () => go(presentation.index + 1);
export const prev = () => go(presentation.index - 1);

/** @param {string} id */
export function indexOf(id) {
	const found = flatSlides.findIndex((slide) => slide.id === id);
	return found === -1 ? 0 : found;
}

/**
 * Start the show. Must be called from a user gesture — both the popup and the
 * fullscreen request depend on it.
 *
 * @param {{ from?: string, notes?: boolean }} [options]
 */
export function present({ from, notes = false } = {}) {
	if (from) presentation.index = indexOf(from);

	if (notes) openPresenter();

	document.documentElement.requestFullscreen?.().catch(() => {});
	goto('/present');
}

/**
 * A real window rather than a tab: `popup` is what makes the browser detach it,
 * and it is sized and centred so it lands somewhere useful on a second screen.
 */
function openPresenter() {
	const width = Math.min(1180, screen.availWidth - 80);
	const height = Math.min(800, screen.availHeight - 80);
	const left = Math.round((screen.availWidth - width) / 2);
	const top = Math.round((screen.availHeight - height) / 2);

	window.open(
		'/present/notes',
		'f26-presenter',
		`popup=yes,width=${width},height=${height},left=${left},top=${top}`
	);
}

/** End the show everywhere and go back to the editor, on the slide you ended on. */
export function exitPresentation() {
	post({ type: 'exit' });
	deck.reveal(slideAt(presentation.index).id);
	if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
	goto('/');
}
