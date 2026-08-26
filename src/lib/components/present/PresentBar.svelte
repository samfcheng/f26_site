<script>
	import IconX from '@tabler/icons-svelte/icons/x';
	import IconArrowsMinimize from '@tabler/icons-svelte/icons/arrows-minimize';
	import IconArrowsMaximize from '@tabler/icons-svelte/icons/arrows-maximize';
	import { EASE_OUT } from '$lib/motion.svelte.js';

	/**
	 * The show's top chrome: a way out, and a way to shrink the show without
	 * leaving it. Floating chips rather than a scrim, so they read over a black
	 * bar and a white slide alike.
	 */
	let { visible, onexit, onfullscreen, fullscreen = false } = $props();
</script>

<div
	class="bar"
	class:visible
	style:transition="opacity 200ms {EASE_OUT}, transform 200ms {EASE_OUT}"
>
	<button class="chip" onclick={onexit}>
		<IconX size={15} stroke={2} />
		<span>Esc</span>
	</button>

	<button
		class="chip icon-only"
		onclick={onfullscreen}
		aria-label={fullscreen ? 'Leave full screen' : 'Go full screen'}
		title={fullscreen ? 'Leave full screen' : 'Go full screen'}
	>
		{#if fullscreen}
			<IconArrowsMinimize size={15} stroke={2} />
		{:else}
			<IconArrowsMaximize size={15} stroke={2} />
		{/if}
	</button>
</div>

<style>
	.bar {
		position: fixed;
		inset: 16px 0 auto 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		opacity: 0;
		transform: translateY(-6px);
		pointer-events: none;
	}

	.bar.visible {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 32px;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		color: var(--fg);
		font-size: 12px;
		cursor: pointer;
		pointer-events: auto;
		transition: background 140ms ease;
	}

	/* Square, so the pair reads as one control and a label, not two labels. */
	.icon-only {
		width: 32px;
		padding: 0;
		justify-content: center;
	}

	@media (hover: hover) and (pointer: fine) {
		.chip:hover {
			background: var(--hover);
		}
	}

	.chip:active {
		background: var(--active);
	}
</style>
