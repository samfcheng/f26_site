<script>
	import SlideStage from './SlideStage.svelte';
	import { getDeck } from '$lib/deck.svelte.js';
	import { EASE_OUT, hoverMs, motion, moveMs } from '$lib/motion.svelte.js';

	/**
	 * One slide in the scrolling deck. A sub-slide is the same element whether
	 * its group is open or collapsed — only the slot's `transform` changes, which
	 * is what makes it appear to slide out from behind its parent.
	 *
	 * The stack transform lives on `.slot` and the hover lift on `.card`, so the
	 * two can run on their own timings without fighting over one property.
	 */
	let {
		slide,
		transform = '',
		lift = 0,
		stacked = false,
		depth = 0,
		z = 1,
		delay = 0,
		onhover = () => {}
	} = $props();

	// Only a sliver of a stacked slide shows, and against a slide of its own
	// colour that sliver has no edge — a black cover behind a black cover reads
	// as one card. Each step down washes toward `--stack-wash`, which lightens a
	// dark slide and darkens a light one, so the steps separate whichever way
	// the slide goes. Deliberately not `filter: brightness()`: that multiplies,
	// so it cannot lift #000 off itself at all, and a `filter` here would make a
	// backdrop root and break the covers' dissolve.
	const wash = $derived(stacked ? motion.recede * (depth + 1) : 0);


	const deck = getDeck();
	const Slide = $derived(slide.component);
	const isParent = $derived(Boolean(slide.children?.length));
	const isActive = $derived(deck.activeId === slide.id);

	/** @type {HTMLElement | undefined} */
	let el = $state();

	$effect(() => {
		if (!el || stacked) return;
		return deck.register(slide.id, el);
	});

	// A zero-height band across the middle of the viewport: whichever card
	// crosses it becomes the active slide. Stacked slides sit behind their
	// parent, so they are not candidates.
	$effect(() => {
		if (!el || stacked) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) deck.observed(slide.id);
			},
			{ rootMargin: '-50% 0px -50% 0px', threshold: 0 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		deck.activate(slide.id);
	}
</script>

<div
	bind:this={el}
	class="slot"
	style:transform={transform || null}
	style:z-index={z}
	style:transition="transform {moveMs()}ms {EASE_OUT} {delay}ms"
>
	<!-- `role` and `tabindex` are applied together, but only for parent slides, so
	     the compiler can't see that the element is interactive when it is focusable. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<article
		class="card"
		class:parent={isParent}
		class:stacked
		id="slide-{slide.id}"
		style:transform={lift ? `translateY(${lift}px)` : null}
		style:transition="transform {hoverMs()}ms {EASE_OUT}"
		aria-label={slide.title}
		aria-current={isActive ? 'true' : undefined}
		role={isParent ? 'button' : undefined}
		tabindex={isParent ? 0 : undefined}
		onclick={isParent ? () => deck.activate(slide.id) : undefined}
		onmouseenter={isParent ? () => onhover(true) : undefined}
		onmouseleave={isParent ? () => onhover(false) : undefined}
		{onkeydown}
	>
		<SlideStage fluid>
			<Slide />
		</SlideStage>

		<div
			class="recede"
			style:opacity={wash}
			style:transition="opacity {moveMs()}ms {EASE_OUT} {delay}ms"
			aria-hidden="true"
		></div>
	</article>
</div>

<style>
	/* Spacing lives on the slot, not as a `gap` on the track: `gap` snaps in and
	   out when a group's height changes, which reads as a step in the animation. */
	.slot {
		position: relative;
		width: 100%;
		/* Never taller than the viewport, so a wide window doesn't push the
		   bottom of the slide off screen. */
		max-width: calc((100dvh - var(--gap) * 2) * var(--stage-ratio, 1.778));
		margin-inline: auto;
		margin-bottom: var(--gap);
		transform-origin: 50% 0;
	}

	.card {
		position: relative;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
	}

	.recede {
		position: absolute;
		inset: 0;
		background: var(--stack-wash);
		pointer-events: none;
	}

	.card.parent {
		cursor: pointer;
	}

	/* See the note in SidebarItem — an outline round a card showing only a
	   sliver draws a hairline where the sliver's own edge should be. */
	.card.stacked {
		box-shadow: none;
	}


</style>
