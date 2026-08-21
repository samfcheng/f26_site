<!-- Placeholder slide. Content intentionally minimal — structure is the focus. -->
<section class="slide">
	<span class="eyebrow">02.1 — Work</span>
	<h1>Kleiner Perkins</h1>
	<p>Sub-slide placeholder.</p>
</section>

<style>
	.slide {
		width: 100%;
		height: 100%;
		padding: 96px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 20px;
		background: #DCE9F2;
		color: #152233;
	}

	.eyebrow {
		font-size: 20px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	h1 {
		margin: 0;
		font-size: 96px;
		line-height: 0.95;
		letter-spacing: -0.03em;
		font-weight: 500;
	}

	p {
		margin: 0;
		max-width: 44ch;
		font-size: 26px;
		line-height: 1.4;
		opacity: 0.6;
	}

	/* Portrait canvas — see layout.svelte.js. */
	@container slide (max-width: 900px) {
		.slide {
			padding: 40px;
			gap: 14px;
		}

		.eyebrow {
			font-size: 16px;
		}

		h1 {
			font-size: 58px;
		}

		p {
			font-size: 20px;
		}
	}
</style>
