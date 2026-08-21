<script>
	import SlideStage from '$lib/components/SlideStage.svelte';
	import SlideCounter from '$lib/components/present/SlideCounter.svelte';
	import { STAGE } from '$lib/layout.svelte.js';
	import { flatSlides } from '$lib/slides/index.js';
	import { connect, go, next, prev, presentation, slideAt, total } from '$lib/present.svelte.js';

	/** The presenter's window: the deck on the left, what to say on the right. */
	const slide = $derived(slideAt(presentation.index));
	const upcoming = $derived(flatSlides[presentation.index + 1]);

	/** @type {HTMLElement | undefined} */
	let list = $state();

	$effect(() => connect({ onexit: () => window.close() }));

	// Follow along when the other window moves.
	$effect(() => {
		const index = presentation.index;
		list?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({
			block: 'nearest',
			behavior: 'smooth'
		});
	});

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) next();
		else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) prev();
		else return;
		event.preventDefault();
	}
</script>

<svelte:head>
	<title>Presenter notes</title>
</svelte:head>

<svelte:window {onkeydown} />

<div class="presenter">
	<aside class="deck" bind:this={list}>
		{#each flatSlides as item, index (item.id)}
			{@const Slide = item.component}
			<button
				class="row"
				class:current={index === presentation.index}
				data-index={index}
				onclick={() => go(index)}
			>
				<span class="num">{index + 1}</span>
				<span class="thumb">
					<SlideStage canvas={STAGE.desktop}>
						<Slide />
					</SlideStage>
				</span>
			</button>
		{/each}
	</aside>

	<main class="notes">
		<header>
			<h1>{slide.title}</h1>
			{#if upcoming}
				<p class="next">Next — {upcoming.title}</p>
			{/if}
		</header>

		<p class="body">{slide.notes ?? 'No notes for this slide.'}</p>

		<footer>
			<SlideCounter index={presentation.index} {total} onprev={prev} onnext={next} />
		</footer>
	</main>
</div>

<style>
	.presenter {
		display: grid;
		grid-template-columns: 232px minmax(0, 1fr);
		height: 100dvh;
		background: var(--bg);
		color: var(--fg);
	}

	.deck {
		overflow-y: auto;
		scrollbar-width: none;
		padding: 14px 0 40px;
		background: var(--surface);
		border-right: 1px solid var(--line);
	}

	.deck::-webkit-scrollbar {
		display: none;
	}

	/* The same row as the editor's slide list, so the two feel like one product. */
	.row {
		display: flex;
		align-items: flex-start;
		width: calc(100% - 20px);
		margin: 0 10px 6px;
		padding: 10px;
		border: 0;
		border-radius: var(--radius-lg);
		background: none;
		color: inherit;
		cursor: pointer;
		transition: background 140ms ease;
	}

	@media (hover: hover) and (pointer: fine) {
		.row:hover {
			background: var(--hover);
		}
	}

	.row.current {
		background: var(--selected);
	}

	.num {
		width: 24px;
		flex: none;
		padding-right: 8px;
		margin-top: 1px;
		font-size: 11px;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.row.current .num {
		color: var(--fg);
	}

	.thumb {
		flex: 1;
		min-width: 0;
		border-radius: var(--radius-sm);
		overflow: hidden;
		box-shadow: 0 0 0 1px var(--line);
	}

	.thumb :global(*) {
		pointer-events: none;
	}

	.notes {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 28px 32px 24px;
		overflow-y: auto;
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--line);
	}

	h1 {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
	}

	.next {
		margin: 0;
		font-size: 16px;
		color: var(--muted);
	}

	.body {
		flex: 1;
		margin: 0;
		font-size: 26px;
		line-height: 1.5;
	}

	footer {
		display: flex;
	}
</style>
