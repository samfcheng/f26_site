<script>
	import DeckCard from './DeckCard.svelte';
	import { getDeck } from '$lib/deck.svelte.js';
	import {
		EASE_OUT,
		hoverOffset,
		motion,
		moveMs,
		staggerMs,
		stackHeight,
		stackTransform
	} from '$lib/motion.svelte.js';

	const deck = getDeck();

	/** @type {HTMLElement | undefined} */
	let scroller = $state();
	/** @type {HTMLElement | undefined} */
	let track = $state();

	let trackWidth = $state(1100);
	let cardWidth = $state(0);
	let cardHeight = $state(0);
	let pitch = $state(0);

	/** Id of the collapsed group currently under the pointer. */
	let hovered = $state('');

	// Measured rather than derived from the aspect ratio, so the stack geometry
	// can't drift from whatever the CSS actually produces.
	$effect(() => {
		trackWidth;
		const slot = track?.querySelector('.slot');
		if (!slot) return;
		const box = slot.getBoundingClientRect();
		cardWidth = box.width;
		cardHeight = box.height;
		pitch = cardHeight + parseFloat(getComputedStyle(slot).marginBottom);
	});

	// Padding that puts the first and last slide in the middle of the viewport.
	const pad = $derived(cardHeight ? cardHeight / 2 : (trackWidth * 9) / 16 / 2);

	$effect(() => {
		if (scroller) deck.setScroller(scroller);
	});

	// Land on the active slide when the deck mounts — the editor is re-created
	// after a presentation and should pick up where the show left off. The target
	// is read at setup, before an observer can claim the first slide.
	const landing = deck.activeId;
	let landed = false;
	$effect(() => {
		if (landed || !pitch) return;
		landed = true;

		// Cards register as they mount and groups take their measured height a
		// frame later, so the landing is re-asserted until the layout settles.
		const land = () => deck.scrollTo(landing, 'instant');
		requestAnimationFrame(() => {
			land();
			requestAnimationFrame(land);
			setTimeout(land, 250);
		});
	});

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		const target = event.target;
		if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable]'))
			return;

		const forward = ['ArrowDown', 'ArrowRight', 'PageDown'];
		const back = ['ArrowUp', 'ArrowLeft', 'PageUp'];

		if (forward.includes(event.key)) {
			event.preventDefault();
			deck.step(1);
		} else if (back.includes(event.key)) {
			event.preventDefault();
			deck.step(-1);
		}
	}
</script>

<svelte:window {onkeydown} />

<main class="deck" bind:this={scroller} style="--pad: max(4vh, calc(50dvh - {pad}px))">
	<div class="track" bind:this={track} bind:clientWidth={trackWidth}>
		{#each deck.slides as slide (slide.id)}
			<DeckCard
				{slide}
				onhover={(/** @type {boolean} */ on) => (hovered = on ? slide.id : '')}
			/>

			{#if slide.children?.length}
				{@const collapsed = deck.isCollapsed(slide.id)}
				{@const n = slide.children.length}
				<div
					class="group"
					class:ready={pitch > 0}
					inert={collapsed}
					style:height="{collapsed
						? stackHeight(n, motion.deckPeek, motion.maxStack)
						: n * pitch}px"
					style:transition="height {moveMs()}ms {EASE_OUT}"
				>
					{#each slide.children as child, i (child.id)}
						{@const stack = stackTransform(
							i,
							cardHeight,
							cardWidth,
							pitch,
							motion.deckPeek,
							motion.maxStack
						)}
						<DeckCard
							slide={child}
							stacked={collapsed}
							z={n - i}
							delay={i * staggerMs()}
							transform={collapsed ? stack.transform : ''}
							lift={collapsed && hovered === slide.id ? hoverOffset(stack.depth) : 0}
						/>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</main>

<style>
	.deck {
		flex: 1;
		min-width: 0;
		height: 100dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--bg);
	}

	.track {
		width: 100%;
		padding-block: var(--pad);
		padding-inline: var(--gap);
	}

	/* Holds the group's sub-slides. Collapsed, it is just tall enough for the
	   stack to peek out; expanded, it is the full height of its slides. The
	   cards themselves overflow it while they are tucked behind the parent.
	   `height` is the one property with no transform equivalent here — the
	   accordion exception. */
	.group {
		position: relative;
		z-index: 0;
		visibility: hidden;
	}

	.group.ready {
		visibility: visible;
	}

</style>
