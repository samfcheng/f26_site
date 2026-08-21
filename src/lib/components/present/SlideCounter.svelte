<script>
	import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';

	/** The `‹ 3 / 11 ›` pill used by both the stage and the presenter view. */
	let { index, total, onprev, onnext, size = 'regular' } = $props();
</script>

<div class="counter" class:small={size === 'small'}>
	<button onclick={onprev} disabled={index === 0} aria-label="Previous slide">
		<IconChevronLeft size={18} stroke={2} />
	</button>

	<span class="readout" aria-live="polite">{index + 1} / {total}</span>

	<button onclick={onnext} disabled={index === total - 1} aria-label="Next slide">
		<IconChevronRight size={18} stroke={2} />
	</button>
</div>

<style>
	.counter {
		display: inline-flex;
		align-items: center;
		padding: 5px;
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		color: var(--fg);
	}

	button {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: inherit;
		cursor: pointer;
		transition: background 140ms ease;
		/* Overlap the readout's hairline so a hover fill covers it rather than
		   stopping a pixel short of it. */
		position: relative;
		margin-inline: -1px;
	}

	button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	@media (hover: hover) and (pointer: fine) {
		button:not(:disabled):hover {
			background: var(--hover);
		}
	}

	button:not(:disabled):active {
		background: var(--active);
	}

	.readout {
		padding: 0 18px;
		font-size: 15px;
		font-variant-numeric: tabular-nums;
		border-inline: 1px solid var(--line);
	}

	.small {
		padding: 4px;
	}

	.small button {
		width: 28px;
		height: 28px;
	}

	.small .readout {
		padding: 0 12px;
		font-size: 13px;
	}
</style>
