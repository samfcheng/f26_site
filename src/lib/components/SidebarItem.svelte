<script>
	import SlideStage from './SlideStage.svelte';
	import { getDeck } from '$lib/deck.svelte.js';
	import { canHover, hoverMs, motion, moveMs } from '$lib/motion.svelte.js';

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
		hovered = false,
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

	// A collapsed group is one object, so its whole stack lights together —
	// `hovered` is the parent's hover arriving from the sidebar. Driven from here
	// rather than a CSS `:hover` so both halves of that run off one value.
	let hovering = $state(false);
	const lit = $derived(canHover() && (hovering || hovered));
	const hoverWash = $derived(
		lit ? (slide.dark ? motion.thumbHoverWashDark : motion.thumbHoverWashLight) : 0
	);

	/** @param {boolean} on */
	function hover(on) {
		hovering = on;
		if (isParent) onhover(on);
	}

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
		style:transition="opacity {motion.fadeMs}ms {motion.deckEasing} {numberDelay}ms,
			transform {moveMs()}ms {motion.deckEasing} {delay}ms"
	>
		{label}
	</span>

	<div
		class="thumb-wrap"
		style:transform={transform || null}
		style:z-index={z}
		style:transition="transform {moveMs()}ms {motion.deckEasing} {delay}ms"
	>
		<button
			class="thumb"
			class:stacked
			style:transform={lift ? `translateY(${lift}px)` : null}
			style:transition="transform {hoverMs()}ms {motion.deckEasing},
				box-shadow {moveMs()}ms {motion.deckEasing} {delay}ms"
			onclick={() => {
				// A thumbnail click only takes the selection there — the group opens
				// on a second click, not automatically on arrival.
				deck.activate(slide.id, { expand: false });
				onnavigate();
			}}
			onmouseenter={() => hover(true)}
			onmouseleave={() => hover(false)}
			aria-current={isActive ? 'true' : undefined}
			title={slide.title}
		>
			<SlideStage>
				<Slide />
			</SlideStage>

			<span
				class="recede"
				style:opacity={wash}
				style:transition="opacity {moveMs()}ms {motion.deckEasing} {delay}ms"
				aria-hidden="true"
			></span>

			<span
				class="hover-wash"
				style:opacity={hoverWash}
				style:transition="opacity {hoverMs()}ms {motion.deckEasing}"
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

	/* The ring stays, so the thumbnail's border doesn't appear to stop where the
	   sliver starts, plus a cast shadow so the sliver survives a light thumbnail
	   on a light pane. See the note in DeckCard. Unstacked thumbnails are ring
	   only — a shadow on every row is heavy in a pane this narrow. */
	.thumb.stacked {
		box-shadow:
			0 0 0 1px var(--line),
			var(--card-shadow-sm);
	}

	/* The card's own paper, not the pane's colour — which is why this is `#fff`
	   and not `--surface`. A slide is white in either theme, so the wash that
	   lightens it has to be too, and the two amounts stay tuned across the
	   toggle. Painted over `.recede`, so a stacked sliver lifts from wherever its
	   wash left it rather than from the slide's own colour. */
	.hover-wash {
		position: absolute;
		inset: 0;
		background: #fff;
	}

	.recede {
		position: absolute;
		inset: 0;
		background: var(--stack-wash);
	}


</style>
