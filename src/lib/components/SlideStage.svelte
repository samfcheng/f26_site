<script>
	import { stage } from '$lib/layout.svelte.js';

	/**
	 * Renders slide content on a fixed canvas and scales it to fit whatever box
	 * it is dropped into — so the same component is both the full-size slide and
	 * its sidebar thumbnail. The canvas swaps to a portrait size on mobile, or a
	 * caller can pin it with `canvas` — the show is always landscape.
	 */
	let { children, canvas } = $props();

	const base = $derived(canvas ?? stage());

	let measured = $state(0);
	const scale = $derived(measured ? measured / base.width : 1);
</script>

<div
	class="stage"
	bind:clientWidth={measured}
	style:aspect-ratio="{base.width} / {base.height}"
	style:--scale={scale}
>
	<div class="canvas" style:width="{base.width}px" style:height="{base.height}px">
		{@render children()}
	</div>
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: #fff;
	}

	/* `text-align` is reset here because a thumbnail's host is a <button>, whose
	   UA `text-align: center` would otherwise inherit into the slide content. */
	.canvas {
		text-align: left;
		position: absolute;
		inset: 0 auto auto 0;
		container-type: inline-size;
		container-name: slide;
		transform: scale(var(--scale));
		transform-origin: 0 0;
	}
</style>
