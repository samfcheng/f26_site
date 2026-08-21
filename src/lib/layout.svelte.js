import { MediaQuery } from 'svelte/reactivity';

const narrow = new MediaQuery('(max-width: 860px)', false);

/**
 * The slide canvas. Slides are authored at these fixed sizes and scaled to fit,
 * so a slide is laid out once per mode rather than at every viewport width.
 * The canvas is a CSS container named `slide`, so slide components adapt with
 * `@container slide (max-width: 900px)` — which holds in thumbnails too.
 */
export const STAGE = {
	desktop: { width: 1280, height: 720 },
	mobile: { width: 780, height: 1040 }
};

export function isMobile() {
	return narrow.current;
}

export function stage() {
	return narrow.current ? STAGE.mobile : STAGE.desktop;
}

const SIDEBAR_KEY = 'f26:sidebar-width';

export const SIDEBAR = { min: 220, max: 520, default: 296 };

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
