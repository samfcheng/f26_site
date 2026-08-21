import { goto } from '$app/navigation';
import { deck } from './deck.svelte.js';
import { flatSlides } from './slides/index.js';

/** Both windows of a presentation talk over this. */
const CHANNEL = 'f26-present';

/** Where the show currently is. Shared by the stage and the presenter view. */
export const presentation = $state({ index: 0 });

/** @type {BroadcastChannel | null} */
let channel = null;

/**
 * Join the presentation channel. Returns a teardown for `$effect`.
 * @param {{ onexit?: () => void }} [handlers]
 */
export function connect(handlers = {}) {
	if (typeof BroadcastChannel === 'undefined') return () => {};

	channel = new BroadcastChannel(CHANNEL);
	channel.onmessage = ({ data }) => {
		if (data?.type === 'index') presentation.index = data.index;
		else if (data?.type === 'exit') handlers.onexit?.();
		else if (data?.type === 'sync') post({ type: 'index', index: presentation.index });
	};

	// Announce where we are, and ask anyone already running where they are.
	post({ type: 'index', index: presentation.index });
	post({ type: 'sync' });

	return () => {
		channel?.close();
		channel = null;
	};
}

/** @param {Record<string, unknown>} message */
function post(message) {
	channel?.postMessage(message);
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
