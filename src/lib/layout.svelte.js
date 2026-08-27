import { MediaQuery } from 'svelte/reactivity';

const narrow = new MediaQuery('(max-width: 860px)', false);
const midWidth = new MediaQuery('(max-width: 1280px)', false);

/**
 * The design canvas: the shape of a slide, and the width slides are drawn at.
 *
 * In the deck and the show a slide is fluid — it lays out at whatever width it
 * is given, and only the aspect ratio here applies. A thumbnail can't be fluid
 * (a 240px row would render a mobile layout at unreadable size), so it lays the
 * slide out at this width and scales the result down. Pick a width near a real
 * deck card's and the thumbnail is a faithful miniature.
 *
 * Both are also the sizes the slides are designed against, so a slide's own
 * `px` values are the ones from its mock.
 */
export const STAGE = {
	desktop: { width: 1920, height: 1080 },
	/* The bridge: 16:9 is a bad shape for a half-width window — the slide gets
	   short enough that the composition has nowhere to go — so between the two
	   the deck squares up. */
	square: { width: 1080, height: 1080 },
	mobile: { width: 810, height: 1080 }
};

export function isMobile() {
	return narrow.current;
}

export function stage() {
	if (narrow.current) return STAGE.mobile;
	return midWidth.current ? STAGE.square : STAGE.desktop;
}

const SIDEBAR_KEY = 'f26:sidebar-width';

export const SIDEBAR = { min: 220, max: 520, default: 250 };

/** Chrome the user can drag around. Restored from the last visit. */
export const chrome = $state({ sidebarWidth: SIDEBAR.default });

export function restoreChrome() {
	const saved = Number(localStorage.getItem(SIDEBAR_KEY));
	if (saved) chrome.sidebarWidth = clampSidebar(saved);
}

/** @param {number} width */
export function setSidebarWidth(width) {
	chrome.sidebarWidth = clampSidebar(width);
	localStorage.setItem(SIDEBAR_KEY, String(chrome.sidebarWidth));
}

/** @param {number} width */
export function clampSidebar(width) {
	return Math.round(Math.min(Math.max(width, SIDEBAR.min), SIDEBAR.max));
}
