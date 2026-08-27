<script>
	import Deck from '$lib/components/Deck.svelte';
	import { deck, setDeck } from '$lib/deck.svelte.js';
	import { CURVES, DEFAULTS, motion, resetMotion } from '$lib/motion.svelte.js';

	/**
	 * A bench for the deck's motion — the peek, and the cursor that sits over it.
	 *
	 * The stage is the real `Deck`, on the real slides, in the real deck state.
	 * Not a mock of it: every knob in the panel is the one the shipped deck
	 * reads, so there is nothing here that can drift from what the site does.
	 * `Deck` mounts `DeckCursor` itself, so both live previews come from one.
	 */
	setDeck(deck);

	/**
	 * @typedef {{
	 *   key: keyof typeof DEFAULTS,
	 *   label: string,
	 *   min: number,
	 *   max: number,
	 *   step: number,
	 *   unit?: string
	 * }} Knob
	 */

	/** @type {{ title: string, curve: 'deckEasing' | 'cursorEasing', note: string, rows: Knob[] }[]} */
	const sections = [
		{
			title: 'Deck peek',
			curve: 'deckEasing',
			note: 'Click a cover to open its group, click again to close it.',
			rows: [
				{ key: 'moveMs', label: 'Travel', min: 60, max: 1200, step: 10, unit: 'ms' },
				{ key: 'staggerMs', label: 'Stagger', min: 0, max: 200, step: 5, unit: 'ms' },
				{ key: 'deckTimeScale', label: 'Slow motion', min: 1, max: 10, step: 0.5, unit: '×' },
				{ key: 'deckPeek', label: 'Peek', min: 2, max: 40, step: 1, unit: 'px' },
				{ key: 'maxStack', label: 'Slivers', min: 1, max: 5, step: 1 },
				{ key: 'recede', label: 'Wash', min: 0, max: 0.6, step: 0.02 },
				{ key: 'deckHoverLift', label: 'Hover lift', min: 0, max: 20, step: 1, unit: 'px' },
				{ key: 'hoverMs', label: 'Hover', min: 60, max: 900, step: 10, unit: 'ms' },
				{ key: 'expandDelayMs', label: 'Travel → open', min: 0, max: 2000, step: 50, unit: 'ms' }
			]
		},
		{
			title: 'Cursor',
			curve: 'cursorEasing',
			note: 'Hover a cover for the cue, hover a Visit pill to watch it roll.',
			rows: [
				{ key: 'cursorOpenMs', label: 'Open', min: 60, max: 900, step: 10, unit: 'ms' },
				{ key: 'cursorMs', label: 'Close', min: 40, max: 900, step: 10, unit: 'ms' },
				{ key: 'cursorRollMs', label: 'Label roll', min: 60, max: 700, step: 10, unit: 'ms' },
				{ key: 'cursorTimeScale', label: 'Slow motion', min: 1, max: 10, step: 0.5, unit: '×' },
				{ key: 'cursorEase', label: 'Follow', min: 0.08, max: 1, step: 0.01 },
				{ key: 'cursorTilt', label: 'Lean', min: -1, max: 1, step: 0.02, unit: '°/px' },
				{ key: 'cursorSkew', label: 'Skew', min: -1, max: 1, step: 0.05, unit: '× lean' },
				{ key: 'cursorDot', label: 'Dot', min: 4, max: 24, step: 1, unit: 'px' },
				{ key: 'cursorHeight', label: 'Height', min: 18, max: 56, step: 1, unit: 'px' },
				{ key: 'cursorPad', label: 'Padding', min: 4, max: 32, step: 1, unit: 'px' },
				{ key: 'cursorFont', label: 'Font', min: 9, max: 22, step: 1, unit: 'px' },
				{ key: 'cursorIcon', label: 'Icon', min: 8, max: 24, step: 1, unit: 'px' }
			]
		}
	];

	// Only what has moved, ready to paste back over the block in motion.svelte.js.
	const changed = $derived(
		/** @type {(keyof typeof DEFAULTS)[]} */ (Object.keys(DEFAULTS))
			.filter((k) => motion[k] !== DEFAULTS[k])
			.map((k) => `\t${k}: ${typeof motion[k] === 'string' ? `'${motion[k]}'` : motion[k]},`)
			.join('\n')
	);

	let copied = $state(false);
	function copy() {
		navigator.clipboard?.writeText(changed);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

<svelte:head><title>Motion — prototype</title></svelte:head>

<div class="bench">
	<Deck />

	<aside class="panel">
		<header>
			<h1>Motion</h1>
			<button onclick={resetMotion}>Reset</button>
		</header>

		{#each sections as section (section.title)}
			<h2>{section.title}</h2>
			<p class="note">{section.note}</p>

			<label class="field">
				<span>Curve</span>
				<select bind:value={motion[section.curve]}>
					{#each Object.entries(CURVES) as [name, css] (name)}
						<option value={css}>{name}</option>
					{/each}
					{#if !Object.values(CURVES).includes(motion[section.curve])}
						<option value={motion[section.curve]}>custom</option>
					{/if}
				</select>
			</label>
			<label class="field">
				<span>cubic-bezier</span>
				<input class="mono" bind:value={motion[section.curve]} spellcheck="false" />
			</label>

			{#each section.rows as row (row.key)}
				<label class="field">
					<span>{row.label}</span>
					<input
						type="range"
						min={row.min}
						max={row.max}
						step={row.step}
						bind:value={motion[row.key]}
					/>
					<output>{motion[row.key]}{row.unit ?? ''}</output>
				</label>
			{/each}
		{/each}

		<h2>Changed</h2>
		{#if changed}
			<pre>{changed}</pre>
			<button onclick={copy}>{copied ? 'Copied' : 'Copy for motion.svelte.js'}</button>
		{:else}
			<p class="note">Everything is at its default.</p>
		{/if}
	</aside>
</div>

<style>
	.bench {
		display: flex;
		height: 100dvh;
		background: var(--bg);
	}

	/* The cursor listens on the deck's own scroller, so it stays inside the deck
	   and the panel keeps an ordinary pointer while you drag sliders. */
	.panel {
		width: 320px;
		flex: none;
		overflow-y: auto;
		padding: 20px;
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}

	.panel header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	h1 {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
	}

	h2 {
		margin: 24px 0 4px;
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.note {
		margin: 0 0 10px;
		font-size: 12px;
		line-height: 1.4;
		color: var(--muted);
	}

	.field {
		display: grid;
		grid-template-columns: 92px 1fr auto;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		font-size: 12px;
	}

	.field > span {
		color: var(--muted);
	}

	.field input[type='range'] {
		width: 100%;
		min-width: 0;
	}

	select,
	.mono {
		grid-column: 2 / -1;
		width: 100%;
		min-width: 0;
		padding: 4px 6px;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--hover);
		font: inherit;
		color: inherit;
	}

	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
	}

	output {
		font-variant-numeric: tabular-nums;
	}

	pre {
		margin: 0 0 8px;
		padding: 10px;
		border-radius: var(--radius-sm);
		background: var(--hover);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		overflow-x: auto;
	}

	button {
		padding: 6px 12px;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--hover);
		font-size: 12px;
		cursor: pointer;
	}

	button:hover {
		background: var(--active);
	}
</style>
