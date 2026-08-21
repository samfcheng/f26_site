<!-- Placeholder title slide. -->
<section class="slide">
	<h1>SAM CHENG</h1>
	<footer>
		<span><b class="pill">Currently</b> Design @ USC</span>
		<span><b class="pill">Prev</b> Kleiner Perkins, Multiply, Oracle, Replit</span>
	</footer>
</section>

<style>
	.slide {
		width: 100%;
		height: 100%;
		padding: 64px;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		color: #111111;
	}

	h1 {
		flex: 1;
		display: grid;
		place-items: center;
		margin: 0;
		font-size: 150px;
		letter-spacing: -0.02em;
		font-weight: 700;
	}

	footer {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		font-size: 24px;
	}

	.pill {
		display: inline-block;
		font-size: 17px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 3px 12px 4px;
		margin-right: 8px;
		border: 2px solid currentColor;
		border-radius: 999px;
	}

	/* Portrait canvas — see layout.svelte.js. */
	@container slide (max-width: 900px) {
		.slide {
			padding: 40px;
		}

		h1 {
			font-size: 76px;
		}

		footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
			font-size: 20px;
		}
	}
</style>
