<script>
	import PresentStage from '$lib/components/present/PresentStage.svelte';
	import PresentBar from '$lib/components/present/PresentBar.svelte';
	import SlideCounter from '$lib/components/present/SlideCounter.svelte';
	import { EASE_OUT } from '$lib/motion.svelte.js';
	import {
		connect,
		exitPresentation,
		go,
		next,
		prev,
		presentation,
		slideAt,
		total
	} from '$lib/present.svelte.js';

	const slide = $derived(slideAt(presentation.index));

	// Any pointer movement brings the chrome back; it leaves again once the
	// pointer settles, along with the cursor.
	let idle = $state(true);

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let idleTimer;

	$effect(() => connect({ onexit: () => exitPresentation() }));

	function onpointermove() {
		idle = false;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (idle = true), 2500);
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		const forward = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
		const back = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];

		if (forward.includes(event.key)) next();
		else if (back.includes(event.key)) prev();
		else if (event.key === 'Escape') exitPresentation();
		else if (event.key === 'Home') go(0);
		else if (event.key === 'End') go(total - 1);
		else return;

		event.preventDefault();
	}
</script>

<svelte:head>
	<title>{slide.title} — presenting</title>
</svelte:head>

<svelte:window {onpointermove} {onkeydown} />

<!-- Advancing by click is a presenter habit; the chrome sits outside this layer
     so its own buttons keep working. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="show" class:idle onclick={() => next()}>
	<PresentStage {slide} />
</div>

<PresentBar visible={!idle} onexit={exitPresentation} />

<div
	class="dock"
	class:visible={!idle}
	style:transition="opacity 200ms {EASE_OUT}, transform 200ms {EASE_OUT}"
>
	<SlideCounter index={presentation.index} {total} onprev={prev} onnext={next} />
</div>

<style>
	.show {
		position: fixed;
		inset: 0;
		background: #000;
	}

	.show.idle {
		cursor: none;
	}

	.dock {
		position: fixed;
		inset: auto 0 26px 0;
		z-index: 10;
		display: grid;
		place-items: center;
		opacity: 0;
		transform: translateY(6px);
		pointer-events: none;
	}

	.dock.visible {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}
</style>
