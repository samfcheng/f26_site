<script>
	import { chrome, setSidebarWidth, SIDEBAR } from '$lib/layout.svelte.js';

	/** Drag handle on the sidebar's trailing edge. */
	let dragging = $state(false);

	/** @param {PointerEvent} event */
	function onpointerdown(event) {
		event.preventDefault();
		dragging = true;
		/** @type {HTMLElement} */ (event.currentTarget).setPointerCapture(event.pointerId);
	}

	/** @param {PointerEvent} event */
	function onpointermove(event) {
		if (!dragging) return;
		setSidebarWidth(event.clientX);
	}

	function stop() {
		dragging = false;
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		const step = event.shiftKey ? 40 : 8;
		if (event.key === 'ArrowLeft') setSidebarWidth(chrome.sidebarWidth - step);
		else if (event.key === 'ArrowRight') setSidebarWidth(chrome.sidebarWidth + step);
		else if (event.key === 'Home') setSidebarWidth(SIDEBAR.default);
		else return;
		event.preventDefault();
	}
</script>

<!-- A focusable `separator` is a valid ARIA widget (it is how splitters are
     built), but the compiler only recognises the static, non-focusable form. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="resizer"
	class:dragging
	role="separator"
	aria-orientation="vertical"
	aria-label="Resize slide list"
	aria-valuenow={chrome.sidebarWidth}
	aria-valuemin={SIDEBAR.min}
	aria-valuemax={SIDEBAR.max}
	tabindex="0"
	{onpointerdown}
	{onpointermove}
	onpointerup={stop}
	onpointercancel={stop}
	ondblclick={() => setSidebarWidth(SIDEBAR.default)}
	{onkeydown}
></div>

<style>
	.resizer {
		position: absolute;
		inset: 0 -3px 0 auto;
		width: 9px;
		z-index: 5;
		cursor: col-resize;
		touch-action: none;
	}

	/* The visible hairline is the sidebar's border; this only shows while the
	   handle is actually in use. */
	.resizer::after {
		content: '';
		position: absolute;
		inset: 0 auto 0 3px;
		width: 2px;
		background: var(--fg);
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.resizer.dragging::after,
	.resizer:focus-visible::after {
		opacity: 0.5;
	}

	.resizer:focus-visible {
		outline: none;
	}
</style>
