<script>
	/**
	 * A project's case study: a strip of screens running off both edges, the
	 * project's name, and the facts — what it was, and what it was for.
	 *
	 * Every number here is a pixel of the mock. There are three mocks — 1920×1080
	 * landscape, 1080×1080 square, 420×560 portrait — and they are three
	 * drawings, not one drawing at three sizes, because a slide's frame has a
	 * fixed aspect and content cannot reflow into extra height the way a page
	 * can. Drawing portrait against a 420-wide grid is what keeps the type
	 * legible on a phone: 15px there is a real 15px on a 420px screen, where
	 * 15px of the 1920 grid would land at 3.
	 *
	 * @typedef {{
	 *   name: string,
	 *   shots: { src: string, alt: string }[],
	 *   info: [string, string][],
	 *   goal: string,
	 *   theme?: 'light' | 'dark'
	 * }} Props
	 */

	/** @type {Props} */
	let { name, shots, info, goal, theme = 'dark' } = $props();
</script>

<section class="work-slide detail {theme}">
	<div class="strip">
		{#each shots as shot (shot.src)}
			<img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
		{/each}
	</div>

	<h2 class="name">{name}</h2>

	<div class="body">
		<div class="block">
			<span class="section">Info</span>
			<dl class="specs">
				{#each info as [label, value] (label)}
					<dt>{label}</dt>
					<dd>{value}</dd>
				{/each}
			</dl>
		</div>

		<div class="block goal">
			<span class="section">Goal</span>
			<p class="goal-text">{goal}</p>
		</div>
	</div>
</section>

<style>
	.work-slide {
		--px: calc(100cqw / 1920);
		/* One pixel of the mock's *type* — see the note in WorkCover. The measures
		   scale with it, so the copy breaks into the same lines it does in the
		   mock, only bigger. */
		--tx: calc(var(--px) * 1.125);
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--paper);
		color: var(--ink);
		font-weight: 400;
	}

	.dark {
		--paper: #000000;
		--ink: #ffffff;
		--label: #808080;
		--edge: transparent;
	}

	.light {
		--paper: #ffffff;
		--ink: #000000;
		/* A shade darker than the dark theme's grey: the same value that reads as
		   quiet on black reads as faint on white. */
		--label: #737373;
		/* The screens are light-on-light here, so they need an edge to sit on
		   the page as objects rather than dissolve into it. */
		--edge: rgb(0 0 0 / 0.1);
	}

	/* Wider than the slide on purpose — centred, so it runs off both edges and
	   reads as a slice of a longer reel. */
	.strip {
		position: absolute;
		top: calc(117 * var(--px));
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: calc(38 * var(--px));
		height: calc(394 * var(--px));
	}

	.strip img {
		flex: none;
		width: auto;
		height: 100%;
		border-radius: 0.125rem;
		border: 1px solid rgb(0 0 0 / 0.05);
	}

	.name {
		position: absolute;
		top: calc(607 * var(--px));
		left: calc(128 * var(--px));
		margin: 0;
		font-size: calc(64 * var(--tx));
		font-weight: 500;
		line-height: 1;
	}

	/* Centred between the name and the bottom edge rather than pinned under the
	   name. The copy runs to different lengths from one project to the next, and
	   a fixed top puts every bit of that difference into the space below — which
	   is what leaves one slide airy at the bottom and the next one crowded. The
	   space starts where the name ends (its top, plus its own height) and ends at
	   the bottom of the slide; the block sits in the middle of it, so what is
	   left over is split evenly above and below. */
	.body {
		position: absolute;
		left: calc(128 * var(--px));
		right: calc(128 * var(--px));
		top: calc((607 * var(--px) + 64 * var(--tx) + 1080 * var(--px)) / 2);
		transform: translateY(-50%);
		display: flex;
		/* One gap, the same as the margin the body sits in, rather than the two
		   blocks hugging the edges with whatever is left over falling down the
		   middle. */
		gap: calc(128 * var(--px));
		font-size: calc(24 * var(--tx));
		line-height: calc(29 * var(--tx));
	}

	/* The two blocks split the width evenly and their values run to the end of
	   it, so the copy is set in a column that fits it rather than in a narrow
	   measure with the slack pushed into the middle of the slide.

	   The label column is a fixed step of the grid, not a gap sized to the word
	   — which is what lines `Info` up with `Goal` and `When` up with the goal
	   copy across the whole width. */
	.block {
		flex: 1;
		display: grid;
		grid-template-columns: calc(126 * var(--tx)) minmax(0, 1fr);
		align-items: start;
		/* Without this the shorter of the two blocks stretches its own rows to
		   fill the height of the taller one, which drops `Goal`'s first line a
		   whole line below `When`. */
		align-content: start;
	}

	.specs {
		display: grid;
		grid-template-columns: calc(126 * var(--tx)) minmax(0, 1fr);
		row-gap: calc(12 * var(--tx));
		margin: 0;
	}

	dt {
		color: var(--label);
	}

	dd {
		margin: 0;
	}

	.goal p {
		margin: 0;
		text-wrap: pretty;
	}

	/* Square keeps the two blocks side by side, but lifts each label above its
	   column instead of beside it — at this width a label column of its own
	   would leave the values in a gutter. The two share the width evenly rather
	   than being pushed to the edges, which is what stops the middle opening up
	   into a hole. */
	@container slide (aspect-ratio < 1.4) {
		.work-slide {
			--px: calc(100cqw / 1080);
		}

		.strip {
			top: calc(96 * var(--px));
			gap: calc(24 * var(--px));
			height: calc(400 * var(--px));
		}

		.name {
			top: calc(580 * var(--px));
			left: calc(72 * var(--px));
			font-size: calc(54 * var(--tx));
		}

		.body {
			left: calc(72 * var(--px));
			right: calc(72 * var(--px));
			top: calc((580 * var(--px) + 54 * var(--tx) + 1080 * var(--px)) / 2);
			justify-content: flex-start;
			gap: calc(80 * var(--px));
			font-size: calc(20 * var(--tx));
			line-height: calc(28 * var(--tx));
		}

		.block,
		.goal {
			flex: 1;
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: calc(10 * var(--px));
		}

		.specs {
			grid-template-columns: calc(96 * var(--tx)) minmax(0, 1fr);
			row-gap: calc(10 * var(--tx));
		}

		dd {
			max-width: none;
		}
	}

	@container slide (aspect-ratio < 0.9) {
		.work-slide {
			--px: calc(100cqw / 420);
		}

		/* Portrait is the one shape where the type scale costs something: the facts
		   stack into a single column, and at the bigger size the longest of them
		   runs off the bottom of the card. The strip gives up the height —
		   at this size it is a row of thumbnails you look at, and the copy is the
		   part you read. Everything above the body moves up with it. */
		.strip {
			top: calc(24 * var(--px));
			gap: calc(12 * var(--px));
			height: calc(92 * var(--px));
		}

		.name {
			top: calc(146 * var(--px));
			left: calc(28 * var(--px));
			font-size: calc(34 * var(--tx));
		}

		/* Portrait stacks them — side by side there is no column left. */
		.body {
			left: calc(28 * var(--px));
			right: calc(28 * var(--px));
			top: calc((146 * var(--px) + 34 * var(--tx) + 560 * var(--px)) / 2);
			display: grid;
			gap: calc(20 * var(--px));
			font-size: calc(13 * var(--tx));
			line-height: calc(18 * var(--tx));
		}

		.block,
		.goal {
			gap: calc(6 * var(--px));
		}

		.specs {
			grid-template-columns: calc(70 * var(--tx)) minmax(0, 1fr);
			row-gap: calc(6 * var(--tx));
		}
	}

</style>
