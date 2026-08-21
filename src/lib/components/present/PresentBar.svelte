<script>
	import IconX from '@tabler/icons-svelte/icons/x';
	import { EASE_OUT } from '$lib/motion.svelte.js';

	/**
	 * The show's top chrome: one way out. A floating chip rather than a scrim, so
	 * it reads over a black bar and a white slide alike.
	 */
	let { visible, onexit } = $props();
</script>

<div
	class="bar"
	class:visible
	style:transition="opacity 200ms {EASE_OUT}, transform 200ms {EASE_OUT}"
>
	<button onclick={onexit}>
		<IconX size={15} stroke={2} />
		<span>Esc</span>
	</button>
</div>

<style>
	.bar {
		position: fixed;
		inset: 16px 0 auto 0;
		z-index: 10;
		display: grid;
		place-items: center;
		opacity: 0;
		transform: translateY(-6px);
		pointer-events: none;
	}

	.bar.visible {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	button {
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

	@media (hover: hover) and (pointer: fine) {
		button:hover {
			background: var(--hover);
		}
	}

	button:active {
		background: var(--active);
	}
</style>
