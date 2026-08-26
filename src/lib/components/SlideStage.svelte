<script>
	import { stage } from '$lib/layout.svelte.js';

	/**
	 * A slide, rendered one of two ways.
	 *
	 * `fluid` — the slide lays itself out at its real size inside a box of the
	 * right aspect ratio. Nothing is transformed, so 16px is 16px: a slide
	 * responds to the space it is given the way a web page does. This is the
	 * deck and the show.
	 *
	 * Default — the slide is laid out on a fixed canvas and CSS-scaled to fit,
	 * so a 240px sidebar row is a miniature of the real thing rather than a
	 * mobile layout at unreadable size. This is thumbnails.
	 *
	 * Either way the box is a CSS container named `slide`, so the same
	 * `@container slide (…)` rules drive both — a thumbnail previews the
	 * layout the deck card at `canvas.width` would have.
	 *
	 * `canvas` pins the canvas rather than following the viewport; the show is
	 * always landscape.
	 */
	let { children, canvas, fluid = false } = $props();

	const base = $derived(canvas ?? stage());

	let measured = $state(0);
	const scale = $derived(measured ? measured / base.width : 1);
</script>

{#if fluid}
	<div class="stage fluid" style:aspect-ratio="{base.width} / {base.height}">
		<div class="canvas">
			{@render children()}
		</div>
	</div>
{:else}
	<div
		class="stage"
		bind:clientWidth={measured}
		style:aspect-ratio="{base.width} / {base.height}"
		style:--scale={scale}
	>
		<div
			class="canvas"
			data-render="thumb"
			style:width="{base.width}px"
			style:height="{base.height}px"
		>
			{@render children()}
		</div>
	</div>
{/if}

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
		/* `size`, not `inline-size`, so slides can key off the canvas *shape*:
		   `@container slide (aspect-ratio < 1)` is the portrait layout, and it
		   means the same thing whether the box is a phone or a thumbnail. */
		container-type: size;
		container-name: slide;
		transform: scale(var(--scale));
		transform-origin: 0 0;
	}

	.fluid .canvas {
		inset: 0;
		width: auto;
		height: auto;
		transform: none;
	}
</style>
