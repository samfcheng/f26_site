<script>
	import IconPlayerPlay from '@tabler/icons-svelte/icons/player-play-filled';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import PresentPopover from './PresentPopover.svelte';
	import PresentMenuList from './PresentMenuList.svelte';

	/** Starts a show. The button opens the menu; the menu picks the mode. */
	let { onpresent, align = 'end' } = $props();

	let open = $state(false);

	/** @param {boolean} withNotes */
	function start(withNotes) {
		open = false;
		onpresent(withNotes);
	}
</script>

<div class="anchor">
	<button class="play" onclick={() => (open = !open)} aria-haspopup="menu" aria-expanded={open}>
		<IconPlayerPlay size={13} />
		<span>Present</span>
		<IconChevronDown size={14} stroke={2} />
	</button>

	{#if open}
		<PresentPopover {align} onclose={() => (open = false)}>
			<PresentMenuList onpresent={start} />
		</PresentPopover>
	{/if}
</div>

<style>
	.anchor {
		position: relative;
	}

	.play {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		height: 28px;
		padding: 0 10px;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
		color: var(--fg);
		font-size: 13px;
		cursor: pointer;
		transition: background 140ms ease;
	}

	@media (hover: hover) and (pointer: fine) {
		.play:hover {
			background: var(--hover);
		}
	}

	.play:active {
		background: var(--active);
	}
</style>
