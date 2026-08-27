<script>
	import IconArrowRight from '@tabler/icons-svelte/icons/arrow-right';

	/**
	 * A project's cover: the work itself, dissolving into the slide so the
	 * lockup at the bottom sits on flat colour rather than on the image.
	 *
	 * The dissolve is the Figma effect, in two parts over the same band — a
	 * progressive background blur, 0 to 48, and a linear fill of the background
	 * colour with stops at 0%, 90% at 66%, and 100%. The blur is what makes it
	 * read as depth rather than as a curtain: without it the image stays sharp
	 * while it dims, and the eye keeps trying to read it.
	 *
	 * The band is measured against the image, not the slide, and always ends
	 * where the image does. That is what lets the same component hold up when
	 * the slide squares up or goes portrait: there, a landscape screen is set
	 * to the full width and stops well short of the bottom, and a dissolve
	 * measured against the slide would leave its edge showing.
	 *
	 * Every number here is a pixel of the mock — see `--px` below.
	 *
	 * @typedef {{
	 *   name: string,
	 *   badge: string,
	 *   image: string,
	 *   alt: string,
	 *   description: string,
	 *   action?: { label: string, href: string },
	 *   theme?: 'light' | 'dark',
	 *   shot?: 'bleed' | 'inset' | 'card',
	 *   background?: string,
	 *   anchor?: string
	 * }} Props
	 */

	/** @type {Props} */
	let {
		name,
		badge,
		image,
		alt,
		description,
		// The mock's pill. Not an <a> — see the note where it is rendered.
		action,
		// Which way the lockup reads against the slide, not how bright the image is.
		theme = 'light',
		background = theme === 'dark' ? '#000000' : '#ffffff',
		// Where the image sits once it is scaled to cover its box.
		anchor = 'center top',
		// How the image is placed, and with it where the dissolve falls — see
		// the three classes in the stylesheet.
		shot = 'bleed'
	} = $props();

	// Six layers, each blurring what the ones before it already blurred, so the
	// blur compounds down the band instead of stepping. The radii and each
	// layer's slice of the band are in the stylesheet, keyed off `nth-child`,
	// so a thumbnail can collapse the stack to a single pass.
	const LAYERS = 6;

	/** @param {MouseEvent | KeyboardEvent} event */
	function open(event) {
		if (!action) return;
		// The card behind this is itself clickable — it selects the slide.
		event.stopPropagation();
		window.open(action.href, '_blank', 'noopener');
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		open(event);
	}
</script>

<section class="work-slide cover {theme}" style:--bg={background} style:--anchor={anchor}>
	<div class="media {shot}">
		<img class="shot" src={image} {alt} loading="lazy" decoding="async" />

		<div class="dissolve" aria-hidden="true">
			{#each { length: LAYERS }}
				<div class="haze"></div>
			{/each}
			<div class="veil"></div>
		</div>
	</div>

	<div class="lockup">
		<img class="badge" src={badge} alt="" decoding="async" />
		<span class="name">{name}</span>
		<p class="description">{description}</p>
		{#if action}
			<!-- Deliberately not an <a>: in the sidebar this slide is the content of
			     a <button>, and the parser would break that nesting apart on
			     hydration. `role` carries the meaning the element can't. -->
			<!-- `data-href` is what the deck cursor reads to name the destination;
			     the click still goes through `open`. -->
			<span
				class="action"
				role="link"
				tabindex="0"
				data-href={action.href}
				onclick={open}
				{onkeydown}
			>
				{action.label}
				<span class="arrow" aria-hidden="true">
					<IconArrowRight size={24} stroke={1.5} />
				</span>
			</span>
		{/if}
	</div>
</section>

<style>
	/* One pixel of the mock. There are three mocks, not one drawing at three
	   sizes — see the note in WorkDetail.svelte. */
	.work-slide {
		--px: calc(100cqw / 1920);
		/* One pixel of the mock's *type*. The mock is drawn for a projector, where
		   the copy is read from across a room; in the deck the same slide is a
		   card on a laptop or a phone, and at that size its 24px body lands under
		   what anyone reads comfortably. So the composition keeps the mock's
		   pixel and the words get a bigger one — every type number below is still
		   the number from the mock. */
		--tx: calc(var(--px) * 1.125);
		--layers: 6;
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--bg);
		font-weight: 400;
	}

	.light {
		--ink: #000000;
		--pill: #000000;
		--pill-ink: #ffffff;
	}

	.dark {
		--ink: #ffffff;
		--pill: #ffffff;
		--pill-ink: #000000;
	}

	.media {
		position: absolute;
		top: var(--media-top, 0);
		left: var(--media-left, 0);
		width: var(--media-width, 100%);
		height: var(--media-height, 100%);
	}

	/* `--from` and `--to` are where the dissolve starts and finishes, as shares
	   of the image. They belong to the placement rather than to the project —
	   how far down the image the slide's bottom edge falls is a fact about how
	   the image was placed. */

	/* A photograph, given the whole frame. */
	.bleed {
		--from: 58%;
		--to: 100%;
	}

	/* A screen set to a width and hanging off the bottom of the slide: the
	   dissolve has to finish at the slide's edge, not the image's. */
	.inset {
		--media-width: calc(1840 * var(--px));
		--media-left: calc(48 * var(--px));
		--media-height: auto;
		--from: 46%;
		--to: 82%;
	}

	/* A screen at its own size, sitting on the slide with a radius: centred, and
	   flush with the bottom edge. */
	.card {
		--media-width: calc(1440 * var(--px));
		--media-left: calc(240 * var(--px));
		--media-top: calc(144 * var(--px));
		--media-height: auto;
		--shot-radius: calc(16 * var(--px));
		--from: 53%;
		--to: 100%;
	}

	.shot {
		display: block;
		width: 100%;
		height: var(--media-height, 100%);
		border-radius: var(--shot-radius, 0);
		object-fit: cover;
		object-position: var(--anchor);
	}

	.dissolve {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* Each layer is masked in over its own slice of the band, so going down the
	   image one more blur is stacked on at a time. */
	.haze {
		--start: calc(var(--from) + var(--i) / var(--layers) * (var(--to) - var(--from)));
		--end: calc(var(--from) + (var(--i) + 1) / var(--layers) * (var(--to) - var(--from)));
		position: absolute;
		inset: 0;
		backdrop-filter: blur(calc(var(--r) * var(--px)));
		-webkit-backdrop-filter: blur(calc(var(--r) * var(--px)));
		mask-image: linear-gradient(to bottom, transparent var(--start), #000 var(--end));
		-webkit-mask-image: linear-gradient(to bottom, transparent var(--start), #000 var(--end));
	}

	.haze:nth-child(1) {
		--i: 0;
		--r: 1.3;
	}

	.haze:nth-child(2) {
		--i: 1;
		--r: 2.6;
	}

	.haze:nth-child(3) {
		--i: 2;
		--r: 5.2;
	}

	.haze:nth-child(4) {
		--i: 3;
		--r: 10.4;
	}

	.haze:nth-child(5) {
		--i: 4;
		--r: 20.9;
	}

	.haze:nth-child(6) {
		--i: 5;
		--r: 41.8;
	}

	/* A sidebar thumbnail is a few hundred pixels wide. Six stacked passes there
	   cost six real backdrop reads of the full canvas and resolve to a picture
	   nobody can tell from one pass spanning the whole band. */
	:global([data-render='thumb']) .work-slide {
		--layers: 1;
	}

	:global([data-render='thumb']) .haze {
		display: none;
	}

	:global([data-render='thumb']) .haze:nth-child(5) {
		display: block;
		--i: 0;
	}

	.veil {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--bg) 0%, transparent) var(--from),
			color-mix(in srgb, var(--bg) 90%, transparent)
				calc(var(--from) + 0.66 * (var(--to) - var(--from))),
			var(--bg) var(--to)
		);
	}

	.lockup {
		position: absolute;
		left: calc(128 * var(--px));
		right: calc(128 * var(--px));
		bottom: calc(98 * var(--px));
		display: flex;
		align-items: center;
		height: calc(64 * var(--px));
		color: var(--ink);
	}

	.badge {
		flex: none;
		width: calc(64 * var(--px));
		height: calc(64 * var(--px));
	}

	.name {
		margin-left: calc(23 * var(--px));
		font-size: calc(49 * var(--tx));
		line-height: 1;
	}

	/* Ragged left, flush right — it hangs off the button rather than sitting in
	   a column of its own. */
	.description {
		margin: 0 calc(32 * var(--px)) 0 auto;
		max-width: calc(830 * var(--tx));
		font-size: calc(24 * var(--tx));
		line-height: calc(36 * var(--tx));
		text-align: right;
	}

	.action {
		display: grid;
		grid-auto-flow: column;
		align-items: center;
		gap: calc(6 * var(--px));
		flex: none;
		height: calc(64 * var(--px));
		padding: 0 calc(32 * var(--px));
		border-radius: 5rem;
		background: var(--pill);
		color: var(--pill-ink);
		font-size: calc(24 * var(--tx));
		line-height: 1;
		cursor: pointer;
	}

	/* Drawn rather than typed. Rotating the `→` character turns a glyph, which
	   the text rasteriser re-hints at every angle — it crawls and thickens on
	   the way round. A vector in a box of its own just turns. */
	.arrow {
		display: grid;
		place-items: center;
		width: 1em;
		height: 1em;
		transition: 0.2s ease-out;
	}

	.arrow :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Hover turns the arrow up to the diagonal that means "leaves this page",
	   and takes a little weight out of the pill so the whole thing reads as live. */
	.action {
		transition: 0.2s ease-out;
	}
	@media (hover: hover) and (pointer: fine) {
		.action:hover {
			opacity: 0.95;

			&:active {
				transform: scale(0.95);
			}
		}

		.action:hover .arrow {
			transform: rotate(-45deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.arrow {
			transition: none;
		}
	}

	/* Square and portrait both stack the lockup: the description alone is wider
	   than either slide, so it can't stay in a row with everything else. And
	   every image is set to the full width at its own aspect rather than cropped
	   to the frame — cropping a landscape screen to 1:1 leaves the middle of a
	   dashboard and none of the thing it is a picture of. That leaves the image
	   ending partway down, which is exactly why the dissolve is measured against
	   the image: it finishes on the last row of it, with no edge to show. */
	@container slide (aspect-ratio < 1.4) {
		.work-slide {
			--px: calc(100cqw / 1080);
		}

		.media,
		.bleed,
		.inset,
		.card {
			--media-top: 0;
			--media-left: 0;
			--media-width: 100%;
			--media-height: auto;
			--shot-radius: 0;
			--from: 55%;
			--to: 100%;
		}

		/* Three columns: the badge, everything that flows, and the pill. The pill
		   sits on the description's row rather than under it — there is width
		   enough here for the two to share a line, and stacking it read as a
		   third thing to get past rather than the end of the second. */
		.lockup {
			left: calc(72 * var(--px));
			right: calc(72 * var(--px));
			bottom: calc(64 * var(--px));
			display: grid;
			grid-template-columns: auto 1fr auto;
			align-items: center;
			gap: calc(26 * var(--px)) calc(16 * var(--px));
			height: auto;
		}

		.badge {
			grid-area: 1 / 1;
		}

		.name {
			grid-area: 1 / 2 / 2 / -1;
		}

		.badge {
			width: calc(56 * var(--px));
			height: calc(56 * var(--px));
		}

		.name {
			margin-left: 0;
			font-size: calc(44 * var(--tx));
		}

		.description {
			grid-area: 2 / 1 / 3 / 3;
			margin: 0;
			max-width: none;
			font-size: calc(21 * var(--tx));
			line-height: calc(30 * var(--tx));
			text-align: left;
		}

		.action {
			grid-area: 2 / 3;
			justify-self: end;
			height: calc(52 * var(--px));
			padding: 0 calc(26 * var(--px));
			font-size: calc(20 * var(--tx));
		}
	}

	@container slide (aspect-ratio < 0.9) {
		.work-slide {
			--px: calc(100cqw / 420);
		}

		/* Back to a stack: there is no room here for the description and the pill
		   to share a line. */
		.lockup {
			left: calc(28 * var(--px));
			right: calc(28 * var(--px));
			bottom: calc(28 * var(--px));
			grid-template-columns: auto 1fr;
			gap: calc(16 * var(--px)) calc(12 * var(--px));
		}

		.description {
			grid-area: 2 / 1 / 3 / -1;
		}

		.action {
			grid-area: 3 / 1 / 4 / -1;
			justify-self: start;
		}

		.badge {
			width: calc(40 * var(--px));
			height: calc(40 * var(--px));
		}

		.name {
			font-size: calc(32 * var(--tx));
		}

		.description {
			font-size: calc(15 * var(--tx));
			line-height: calc(22 * var(--tx));
		}

		.action {
			height: calc(40 * var(--px));
			padding: 0 calc(20 * var(--px));
			font-size: calc(15 * var(--tx));
		}
	}
</style>
