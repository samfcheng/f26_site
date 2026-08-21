<script>
	import { EASE_OUT } from '$lib/motion.svelte.js';

	/** The floating surface a present menu sits on. Dismiss handling lives here. */
	let { onclose, align = 'end', children } = $props();

	/** @type {HTMLElement | undefined} */
	let el = $state();

	// Focus the container, not the first item: Tab still walks the options, but
	// opening the menu doesn't paint a focus ring on one of them.
	$effect(() => {
		el?.focus({ preventScroll: true });
	});

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		onclose();
	}
</script>

<svelte:window
	onpointerdown={(e) => !el?.contains(/** @type {Node} */ (e.target)) && onclose()}
	{onkeydown}
/>

<div
	class="popover"
	class:start={align === 'start'}
	bind:this={el}
	role="menu"
	tabindex="-1"
	style:animation="pop 140ms {EASE_OUT}"
>
	{@render children()}
</div>

<style>
	.popover {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		transform-origin: 100% 0;
	}

	.popover.start {
		right: auto;
		left: 0;
		transform-origin: 0 0;
	}

	.popover:focus-visible {
		outline: none;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.97) translateY(-3px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.popover {
			animation: none !important;
		}
	}
</style>
