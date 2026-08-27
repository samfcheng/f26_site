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
			<p>{goal}</p>
		</div>
	</div>
</section>

<style>
	.work-slide {
		--px: calc(100cqw / 1920);
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
		border-radius: 0.25rem;
		border: 1px solid rgb(0 0 0 / 0.05);
	}

	.name {
		position: absolute;
		top: calc(607 * var(--px));
		left: calc(128 * var(--px));
		margin: 0;
		font-size: calc(64 * var(--px));
		font-weight: 500;
		line-height: 1;
	}

	.body {
		position: absolute;
		left: calc(128 * var(--px));
		right: calc(128 * var(--px));
		top: calc(777 * var(--px));
		display: flex;
		justify-content: space-between;
		font-size: calc(24 * var(--px));
		line-height: calc(29 * var(--px));
	}

	/* The label column is a fixed step of the grid, not a gap sized to the word
	   — which is what lines `Info` up with `Goal` and `When` up with the goal
	   copy across the whole width. */
	.block {
		display: grid;
		grid-template-columns: calc(126 * var(--px)) auto;
		align-items: start;
		/* Without this the shorter of the two blocks stretches its own rows to
		   fill the height of the taller one, which drops `Goal`'s first line a
		   whole line below `When`. */
		align-content: start;
	}

	.goal {
		grid-template-columns: calc(126 * var(--px)) calc(383 * var(--px));
	}

	.specs {
		display: grid;
		grid-template-columns: calc(126 * var(--px)) auto;
		row-gap: calc(12 * var(--px));
		margin: 0;
	}

	dt {
		color: var(--label);
	}

	/* Wide enough for `Design, UI/UX, Prototyping` to hold one line, narrow
	   enough that the team breaks after the ampersand, as in the mock. */
	dd {
		margin: 0;
		max-width: calc(285 * var(--px));
	}

	.goal p {
		margin: 0;
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
			font-size: calc(54 * var(--px));
		}

		.body {
			left: calc(72 * var(--px));
			right: calc(72 * var(--px));
			top: calc(740 * var(--px));
			justify-content: flex-start;
			gap: calc(80 * var(--px));
			font-size: calc(20 * var(--px));
			line-height: calc(28 * var(--px));
		}

		.block,
		.goal {
			flex: 1;
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: calc(10 * var(--px));
		}

		.specs {
			grid-template-columns: calc(96 * var(--px)) minmax(0, 1fr);
			row-gap: calc(10 * var(--px));
		}

		dd {
			max-width: none;
		}
	}

	@container slide (aspect-ratio < 0.9) {
		.work-slide {
			--px: calc(100cqw / 420);
		}

		.strip {
			top: calc(36 * var(--px));
			gap: calc(12 * var(--px));
			height: calc(132 * var(--px));
		}

		.name {
			top: calc(198 * var(--px));
			left: calc(28 * var(--px));
			font-size: calc(34 * var(--px));
		}

		/* Portrait stacks them — side by side there is no column left. */
		.body {
			left: calc(28 * var(--px));
			right: calc(28 * var(--px));
			top: calc(258 * var(--px));
			display: grid;
			gap: calc(20 * var(--px));
			font-size: calc(13 * var(--px));
			line-height: calc(18 * var(--px));
		}

		.block,
		.goal {
			gap: calc(6 * var(--px));
		}

		.specs {
			grid-template-columns: calc(70 * var(--px)) minmax(0, 1fr);
			row-gap: calc(6 * var(--px));
		}
	}

</style>
