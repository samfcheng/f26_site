<script>
	/**
	 * The headline from samcheng.co, rebuilt as a slide.
	 *
	 * Every dimension inside the title is in `em`, so the whole composition —
	 * chips, handles, popup, flowers — scales with one font size. That size is
	 * in `cqw`, so this slide is the one that does keep scaling with its frame:
	 * it is a display headline that should fill whatever it is given, at any
	 * width and in either canvas shape.
	 */

	// The orange chip is a Figma selection: clicking it opens the note above.
	let noteOpen = $state(false);

	let waving = $state(false);

	function wave() {
		if (waving) return;
		waving = true;
		setTimeout(() => (waving = false), 1000);
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		noteOpen = !noteOpen;
	}
</script>

<section class="slide">
	<h1 class="title">
		<div class="line">
			<div class="row">
				<span>I'm</span>
				<div class="chip headshot"></div>
				<span><span class="name">Sam Cheng</span>,</span>
			</div>
			<div class="row">
				<span>a</span>
				<div class="note-wrap">
					<!-- A real <button> would be nested inside the sidebar thumbnail's
					     button, which the HTML parser breaks apart on hydration. -->
					<span
						class="design-chip"
						class:active={noteOpen}
						role="button"
						tabindex="0"
						aria-label="Learn more"
						aria-expanded={noteOpen}
						onclick={() => (noteOpen = !noteOpen)}
						{onkeydown}
					>
						<span class="x-icon"></span>
						<span class="left-corners"></span>
						<span class="right-corners"></span>
					</span>
					<span class="note" class:open={noteOpen}>
						I love designing valuable products and telling meaningful stories
					</span>
				</div>
				<span>designer<span class="amp-end">&nbsp;&amp;</span></span>
			</div>
		</div>
		<div class="line">
			<div class="row">
				<!-- Portrait breaks the headline a word earlier, and `&` can't move
				     between the two rows — so it is written in both, and whichever
				     row is the one being drawn shows its own. -->
				<span class="amp-start">&amp;</span>
				<span>storyteller</span>
				<div class="wave" class:waving onmouseenter={wave} aria-hidden="true">
					<img src="/assets/icon-wave.svg" alt="" />
				</div>
			</div>
			<div class="row">
				<span>based in</span>
				<div class="chip california"></div>
				<div class="california-wrap">
					<span class="california-text">California</span>
					{#each { length: 8 }}
						<img class="flower" src="/assets/flower.svg" alt="" aria-hidden="true" />
					{/each}
				</div>
			</div>
		</div>
	</h1>
</section>

<style>
	.slide {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		padding: 0 5.6cqw;
		background: #ffffff;
		color: #000000;
	}

	.title {
		/* Overshoots and settles — the chip and the flowers both pop with it. */
		--bounce: 0.3s
			linear(
				0,
				0.395 7.7%,
				0.703 15.9%,
				0.924 24.7%,
				1.002 29.3%,
				1.062 34.2%,
				1.096 38.3%,
				1.119 42.6%,
				1.13 47.2%,
				1.131 52.1%,
				1.11 61%,
				1.019 85.1%,
				1.004 92.4%,
				1
			);
		/* `fit-content` sizes the block to the wider (bottom) line, which is what
		   leaves the top line room for the orange chip to grow into. */
		width: fit-content;
		margin: 0;
		font-size: 4.85cqw;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.01em;
	}

	.line {
		display: flex;
		align-items: center;
		gap: 0.2em;
	}

	/* The rows are where portrait breaks the headline. Everywhere else they
	   dissolve — their children become items of the line's own flex row, which
	   is the layout as if the wrappers were not there at all. */
	.row {
		display: contents;
	}

	/* The portrait ampersand — the landscape one is inline in `designer &`. */
	.amp-start {
		display: none;
	}

	/* Headshot and bridge. The cutout is a square anchored to the bottom of the
	   chip, so it breaks out over the top edge. */
	.chip {
		position: relative;
		width: 1.1em;
		height: 0.8em;
		border-radius: 0.084em;
		background: #f0b100;
		background-size: 100% 100%;
		background-position: center;
		background-repeat: no-repeat;
		transition: 0.2s ease;
	}

	.chip::after {
		content: '';
		position: absolute;
		inset: auto 0 0 0;
		aspect-ratio: 1 / 1;
		background-size: 100% 100%;
		background-position: center;
		background-repeat: no-repeat;
		transition: 0.2s ease;
	}

	.chip:hover,
	.chip:hover::after {
		background-size: 105% 105%;
	}

	.headshot::after {
		background-image: url('/assets/headshot-cutout.webp');
	}

	.california {
		background-image: url('/assets/bridge-background.webp');
	}

	.california::after {
		background-image: url('/assets/bridge-cutout.webp');
	}

	/* Hovering a chip wipes its colour across the words it belongs to. */
	.name,
	.california-text {
		background-size: 200%;
		background-position: 100% 0;
		background-clip: text;
		color: rgb(0 0 0 / 0);
		transition: 0.4s ease;
		transition-delay: 0s;
	}

	.name {
		background-image: linear-gradient(90deg, #f0b100 0%, #f0b100 50%, #000 50%, #000 100%);
	}

	.california-text {
		background-image: linear-gradient(90deg, #00b8db 0%, #00b8db 50%, #000 50%, #000 100%);
	}

	.title:has(.headshot:hover) .name {
		background-position: 0 0;
		transition-delay: 0.2s;
	}

	.california-wrap {
		position: relative;
		--delay: 0.03s;
		--delay-offset: 0.2s;
	}

	.title:has(.chip.california:hover) .california-text {
		background-position: 0 0;
		transition-delay: var(--delay-offset);
	}

	.flower {
		position: absolute;
		height: 0.5em;
		transform: scale(0) rotate(0deg);
		filter: blur(1px);
		opacity: 0;
		transition: var(--bounce);
	}

	.flower:nth-of-type(1) {
		bottom: calc(0.3em / 4.5);
		left: calc(-0.1em / 4.5);
		transition-delay: calc(var(--delay) * 8);
	}

	.flower:nth-of-type(2) {
		top: calc(0.2em / 4.5);
		left: calc(1em / 4.5);
		transition-delay: calc(var(--delay) * 7);
	}

	.flower:nth-of-type(3) {
		bottom: calc(-0.05em / 4.5);
		left: calc(2.6em / 4.5);
		transition-delay: calc(var(--delay) * 6);
	}

	.flower:nth-of-type(4) {
		bottom: calc(0.1em / 4.5);
		left: 40%;
		transition-delay: calc(var(--delay) * 5);
	}

	.flower:nth-of-type(5) {
		top: calc(0.4em / 4.5);
		left: 50%;
		transition-delay: calc(var(--delay) * 4);
	}

	.flower:nth-of-type(6) {
		top: calc(2.5em / 4.5);
		right: 20%;
		transition-delay: calc(var(--delay) * 3);
	}

	.flower:nth-of-type(7) {
		bottom: calc(0.1em / 4.5);
		right: calc(-0.5em / 4.5);
		transition-delay: calc(var(--delay) * 2);
	}

	.flower:nth-of-type(8) {
		top: calc(0.4em / 4.5);
		right: calc(0.2em / 4.5);
		transition-delay: calc(var(--delay) * 1);
	}

	.title:has(.chip.california:hover) .flower {
		opacity: 1;
		filter: blur(0);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(1) {
		transform: scale(0.9) rotate(20deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 1);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(2) {
		transform: scale(0.7) rotate(30deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 2);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(3) {
		transform: scale(1.1) rotate(10deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 3);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(4) {
		transform: scale(0.7) rotate(20deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 4);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(5) {
		transform: scale(0.9) rotate(10deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 5);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(6) {
		transform: scale(0.6) rotate(30deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 6);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(7) {
		transform: scale(1.1) rotate(20deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 7);
	}

	.title:has(.chip.california:hover) .flower:nth-of-type(8) {
		transform: scale(0.7) rotate(10deg);
		transition-delay: calc(var(--delay-offset) + var(--delay) * 8);
	}

	/* The chip takes the slack in the top line, so both lines end flush. */
	.note-wrap {
		position: relative;
		flex-grow: 1;
	}

	/* A second click on a chip is the reader closing what the first one opened,
	   and the browser reads that pair as a double-click on text — it has no
	   words of its own, so it takes the note's instead and the popup lights up
	   mid-sentence. Neither is text anyone means to select. */
	.design-chip,
	.note {
		user-select: none;
		-webkit-user-select: none;
	}

	.design-chip {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 0.8em;
		border-radius: 5rem;
		background: #ff6900;
		cursor: pointer;
		transition: var(--bounce);
	}

	.design-chip::after {
		content: '';
		position: absolute;
		inset: 0;
		outline: 1px solid #2b7fff;
	}

	.design-chip:hover {
		transform: scale(1.025);
	}

	.design-chip:active {
		transform: scale(0.975);
	}

	.design-chip.active {
		background: #000000;
	}

	.x-icon {
		position: relative;
		display: grid;
		place-items: center;
		width: 0.4em;
		height: 0.4em;
		transition: var(--bounce);
	}

	.design-chip.active .x-icon {
		transform: rotate(45deg);
	}

	.x-icon::before,
	.x-icon::after {
		content: '';
		position: absolute;
		width: 0.0625em;
		height: 0.0625em;
		background: #ffffff;
	}

	.x-icon::before {
		height: 100%;
	}

	.x-icon::after {
		width: 100%;
	}

	/* Selection handles. */
	.left-corners,
	.right-corners {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.left-corners::before,
	.left-corners::after,
	.right-corners::before,
	.right-corners::after {
		content: '';
		position: absolute;
		z-index: 2;
		width: 0.104em;
		height: 0.104em;
		border-radius: 1px;
		outline: 1px solid #2b7fff;
		background: #ffffff;
	}

	.left-corners::before {
		top: -0.0625em;
		left: -0.0625em;
	}

	.left-corners::after {
		bottom: -0.0625em;
		left: -0.0625em;
	}

	.right-corners::before {
		top: -0.0625em;
		right: -0.0625em;
	}

	.right-corners::after {
		bottom: -0.0625em;
		right: -0.0625em;
	}

	.design-chip:hover .left-corners::before,
	.design-chip:hover .left-corners::after,
	.design-chip:hover .right-corners::before,
	.design-chip:hover .right-corners::after {
		transform: scale(0.975);
	}

	.design-chip:active .left-corners::before,
	.design-chip:active .left-corners::after,
	.design-chip:active .right-corners::before,
	.design-chip:active .right-corners::after {
		transform: scale(1.025);
	}

	/* Sized in its own `em`, so the note scales with the headline: the numbers
	   are the site's px values over its 14px note text. Every dimension below is
	   in that em, line breaks included — so the floor makes the whole popup
	   bigger and it still breaks into the same two lines.

	   The floor is the one place this slide stops scaling with its frame. At the
	   portrait headline's size the proportional value lands near 9px, which is
	   body copy on a phone rendered at footnote size: legibility is not
	   proportional, and 12px is where this stops being a squint. */
	.note {
		position: absolute;
		z-index: 2;
		top: -5.429em;
		left: 50%;
		display: grid;
		place-items: center;
		width: 18.286em;
		height: 4.857em;
		padding: 1.143em;
		border-radius: 0.571em;
		background: #000000;
		color: #ffffff;
		font-size: max(12px, 0.292em);
		font-weight: 400;
		letter-spacing: initial;
		line-height: 1.3;
		text-align: center;
		transform: translateX(-50%) scale(0.95);
		transform-origin: center 80%;
		filter: blur(2px);
		opacity: 0;
		transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.note.open {
		transform: translateX(-50%) scale(1);
		filter: blur(0);
		opacity: 1;
	}

	/* A message bubble — round, with a tail at the bottom left. */
	.wave {
		position: relative;
		display: grid;
		place-items: center;
		width: 1.1em;
		height: 0.8em;
		border-radius: 5rem;
		background: #2b7fff;
	}

	.wave img {
		height: 0.5em;
		margin-left: -0.075em;
		transform: rotate(20deg);
		transform-origin: 55% 70%;
	}

	.wave::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: calc(0.8em * 0.3);
		height: calc(0.6em * 0.3);
		background-image: url('/assets/message-tail.svg');
		background-size: contain;
		background-repeat: no-repeat;
	}

	.wave.waving img {
		animation: wave 0.75s ease 1;
	}

	@keyframes wave {
		0% {
			transform: rotate(20deg);
		}
		25% {
			transform: rotate(0deg);
		}
		75% {
			transform: rotate(40deg);
		}
		100% {
			transform: rotate(20deg);
		}
	}

	/* Portrait. Two rows of headline on a phone are two rows of small type — the
	   width is the constraint, so the only way to make the words bigger is to
	   give them more rows. Four, broken where the phrase breaks: the name, what
	   I do, what I am, where I am. The chip still takes the slack in its row, so
	   the composition holds. */
	@container slide (aspect-ratio < 0.9) {
		.title {
			font-size: 8.4cqw;
		}

		/* Four rows, each its own flex line. `width: fit-content` on the title
		   then measures the widest of them — `based in 🌉 California`, with the
		   bridge at the size it was drawn — and that width is what the other
		   three fill. The headline is as wide as it needs to be, not as wide as
		   the card. */
		.line {
			display: block;
		}

		.row {
			display: flex;
			align-items: center;
			gap: 0.2em;
		}

		.amp-end {
			display: none;
		}

		.amp-start {
			display: block;
		}

		/* One element per row takes the slack, so all four come out level. The
		   orange chip already worked this way; in portrait the headshot and the
		   wave earn their keep too. The bridge is left out on purpose — it sets
		   the width, so it keeps its shape. */
		.headshot,
		.wave {
			flex-grow: 1;
		}

		/* A chip growing must not take its cutout with it: the photo keeps the
		   size it was drawn at and centres in the wider block. */
		.headshot::after {
			left: 50%;
			right: auto;
			width: 1.1em;
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave.waving img {
			animation: none;
		}
	}
</style>
