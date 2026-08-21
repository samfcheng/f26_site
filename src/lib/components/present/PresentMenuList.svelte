<script>
	import IconPresentation from '@tabler/icons-svelte/icons/presentation';
	import IconNotes from '@tabler/icons-svelte/icons/notes';

	/** The same two choices as a plain menu — the smallest version of this UI. */
	let { onpresent } = $props();

	const items = [
		{
			label: 'Presentation',
			hint: 'Just one view',
			shortcut: '⌥⌘↵',
			icon: IconPresentation,
			notes: false
		},
		{
			label: 'Presentation with notes',
			hint: 'A second window for your notes',
			shortcut: '⌥⇧⌘↵',
			icon: IconNotes,
			notes: true
		}
	];
</script>

<div class="list">
	{#each items as item (item.label)}
		{@const Icon = item.icon}
		<button onclick={() => onpresent(item.notes)}>
			<Icon size={17} stroke={1.6} />
			<span class="text">
				<span class="label">{item.label}</span>
				<span class="hint">{item.hint}</span>
			</span>
			<kbd>{item.shortcut}</kbd>
		</button>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		width: 268px;
		padding: 4px;
	}

	button {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--fg);
		text-align: left;
		cursor: pointer;
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

	.text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex: 1;
		min-width: 0;
	}

	.label {
		font-size: 13px;
	}

	.hint {
		font-size: 11px;
		color: var(--muted);
	}

	kbd {
		font: inherit;
		font-size: 11px;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
</style>
