<script>
	import SlideStage from '../SlideStage.svelte';
	import { STAGE } from '$lib/layout.svelte.js';

	/**
	 * A slide letterboxed inside black — as large as fits, never cropped.
	 * Used by the show and by the presenter view's preview.
	 */
	let { slide, rounded = false } = $props();

	const Slide = $derived(slide.component);
</script>

<div class="letterbox">
	<div class="frame" class:rounded>
		<SlideStage fluid canvas={STAGE.desktop}>
			<Slide />
		</SlideStage>
	</div>
</div>

<style>
	.letterbox {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		background: #000;
		overflow: hidden;
	}

	.frame {
		width: min(100%, calc(100% * 16 / 9));
		max-width: 100%;
		max-height: 100%;
		aspect-ratio: 16 / 9;
	}

	/* Fit inside whichever axis runs out first. */
	@supports (height: 1cqh) {
		.letterbox {
			container-type: size;
		}

		.frame {
			width: min(100cqw, calc(100cqh * 16 / 9));
		}
	}

	.rounded :global(.stage) {
		border-radius: var(--radius-lg);
	}
</style>
