<script>
	import SlideStage from './SlideStage.svelte';
	import { getDeck } from '$lib/deck.svelte.js';
	import { EASE_OUT, hoverMs, motion, moveMs } from '$lib/motion.svelte.js';

	/**
	 * A thumbnail row in the sidebar. Sub-slides are the same rows whether their
	 * group is open or collapsed; only the thumbnail's transform changes.
	 */
	let {
		slide,
		label,
		transform = '',
		offset = 0,
		lift = 0,
		stacked = false,
		depth = 0,
		z = 1,
		delay = 0,
		onhover = () => {},
		onnavigate = () => {}
	} = $props();

	const deck = getDeck();
	const Slide = $derived(slide.component);

	/** See the note in DeckCard — same wash, so the two panes stay in step. */
	const wash = $derived(stacked ? motion.recede * (depth + 1) : 0);
	const isActive = $derived(deck.activeId === slide.id);
	const isParent = $derived(Boolean(slide.children?.length));


	// The number rides down with its thumbnail rather than fading in at the
	// destination, where it would appear in empty space ahead of the slide.
	const numberTransform = $derived(
		motion.numberMode === 'travel' && stacked ? `translateY(${offset}px)` : null
	);
	const numberDelay = $derived(
		stacked || motion.numberMode === 'fade' ? 0 : motion.fadeDelayMs
	);
</script>

<div class="row" class:active={isActive} data-item={slide.id}>
	<span
		class="num"
		style:opacity={stacked ? 0 : 1}
		style:transform={numberTransform}
		style:transition="opacity {motion.fadeMs}ms {EASE_OUT} {numberDelay}ms,
			transform {moveMs()}ms {EASE_OUT} {delay}ms"
	>
		{label}
	</span>

	<div
		class="thumb-wrap"
		style:transform={transform || null}
		style:z-index={z}
		style:transition="transform {moveMs()}ms {EASE_OUT} {delay}ms"
	>
		<button
			class="thumb"
			class:stacked
			style:transform={lift ? `translateY(${lift}px)` : null}
			style:transition="transform {hoverMs()}ms {EASE_OUT}"
			onclick={() => {
				deck.activate(slide.id);
				onnavigate();
			}}
			onmouseenter={isParent ? () => onhover(true) : undefined}
			onmouseleave={isParent ? () => onhover(false) : undefined}
			aria-current={isActive ? 'true' : undefined}
			title={slide.title}
		>
			<SlideStage>
				<Slide />
			</SlideStage>

			<span
				class="recede"
				style:opacity={wash}
				style:transition="opacity {moveMs()}ms {EASE_OUT} {delay}ms"
				aria-hidden="true"
			></span>
		</button>
	</div>
</div>

<style>
	.row {
		position: relative;
		display: flex;
		/* `.list` is a height-constrained flex column — a shrinkable row lets the
		   flex algorithm eat the height a transition is animating. */
		flex: none;
		align-items: flex-start;
		margin: 0 10px 6px;
		padding: 10px;
	}

	.num {
		width: 24px;
		flex: none;
		padding-right: 8px;
		/* Optically level with the top edge of the thumbnail. */
		margin-top: 1px;
		line-height: 1.1;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
		color: var(--muted);
	}

	.row.active .num {
		color: var(--fg);
	}

	.thumb-wrap {
		position: relative;
		flex: 1;
		min-width: 0;
		transform-origin: 50% 0;
	}

	.thumb {
		position: relative;
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		cursor: pointer;
	}

	.thumb :global(*) {
		pointer-events: none;
	}

	/* Only a sliver of a stacked thumbnail shows, and an outline drawn round the
	   whole card leaves a hairline across the bottom of that sliver — the
	   darkest thing under a light slide, which is not what should read there.
	   The sliver's own edge against the pane is enough. */
	.thumb.stacked {
		box-shadow: none;
	}

	.recede {
		position: absolute;
		inset: 0;
		background: var(--stack-wash);
	}


</style>
