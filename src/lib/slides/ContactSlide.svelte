<script>
	/**
	 * The closing slide: a line, and the handles under it.
	 *
	 * The three social chips share one handle, so they sit together and the
	 * handle is written once after them rather than three times.
	 *
	 * Every number here is a pixel of the mock — see `--px` below.
	 */

	const socials = [
		{
			label: 'Instagram',
			href: 'https://instagram.com/samfcheng',
			fill: 'linear-gradient(90deg, #ebc3fc, #fec7cb)'
		},
		{
			label: 'X (Twitter)',
			href: 'https://x.com/samfcheng',
			fill: 'linear-gradient(90deg, #c6f0fe, #dee2e3)'
		},
		{
			label: 'LinkedIn',
			href: 'https://linkedin.com/in/samfcheng',
			fill: 'linear-gradient(90deg, #fbfcff, #cbd4ff)'
		}
	];

	const EMAIL = 'sam@samfcheng.com';

	/**
	 * Not an <a>: in the sidebar this slide is the content of a <button>, and
	 * the parser would break that nesting apart on hydration.
	 * @param {string} href
	 */
	function open(href) {
		return (/** @type {MouseEvent | KeyboardEvent} */ event) => {
			// The card behind this is itself clickable — it selects the slide.
			event.stopPropagation();
			window.open(href, '_blank', 'noopener');
		};
	}

	/** @param {string} href */
	function keys(href) {
		return (/** @type {KeyboardEvent} */ event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			open(href)(event);
		};
	}
</script>

<section class="slide">
	<div class="block">
		<p class="lead">More coming soon. For now, let’s connect:</p>

		<p class="line">
			{#each socials as social (social.label)}
				<!-- `data-href` names the destination for the deck cursor. -->
				<span
					class="chip"
					style:--fill={social.fill}
					role="link"
					tabindex="0"
					data-href={social.href}
					onclick={open(social.href)}
					onkeydown={keys(social.href)}
				>
					{social.label}
				</span>
			{/each}
			<span class="handle">/samfcheng</span>
		</p>

		<p class="line">
			<span
				class="chip"
				role="link"
				tabindex="0"
				data-href="mailto:{EMAIL}"
				onclick={open(`mailto:${EMAIL}`)}
				onkeydown={keys(`mailto:${EMAIL}`)}
			>
				Email
			</span>
			<span class="handle">{EMAIL}</span>
		</p>
	</div>
</section>

<style>
	/* One pixel of the mock — see the note in WorkDetail.svelte for why there
	   are three of them rather than one drawing at three sizes. */
	.slide {
		--px: calc(100cqw / 1920);
		/* One pixel of the mock's type — see the note in WorkCover. */
		--tx: calc(var(--px) * 1.125);
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		padding: calc(64 * var(--px));
		background: #ffffff;
		color: #000000;
		font-weight: 400;
	}

	.block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(16 * var(--px));
	}

	.lead {
		margin: 0 0 calc(13 * var(--px));
		font-size: calc(26 * var(--tx));
		font-weight: 500;
		line-height: 1.3;
		text-align: center;
	}

	.line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: calc(13 * var(--px));
		margin: 0;
		font-size: calc(26 * var(--px));
		line-height: 1;
	}

	/* An outlined pill with the platform's own colour washed through it. */
	.chip {
		display: inline-flex;
		align-items: center;
		height: calc(32 * var(--tx));
		padding: 0 calc(12 * var(--tx));
		border: calc(2 * var(--px)) solid #000000;
		border-radius: 999px;
		background: var(--fill, #ffffff);
		font-size: calc(16 * var(--tx));
		font-weight: 600;
		letter-spacing: 0.02em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		transition: opacity 160ms ease;
	}

	@media (hover: hover) and (pointer: fine) {
		.chip:hover {
			opacity: 0.9;
		}
	}

	/* The chips are the loud part; what they point at is not. */
	.handle {
		color: #5c5c5c;
		white-space: nowrap;
	}

	/* The handle can't stay on the chips' line at these widths. */
	@container slide (aspect-ratio < 1.4) {
		.slide {
			--px: calc(100cqw / 1080);
			padding: calc(48 * var(--px));
		}
	}

	@container slide (aspect-ratio < 0.9) {
		.slide {
			--px: calc(100cqw / 420);
			padding: calc(28 * var(--px));
		}

		.block {
			gap: calc(12 * var(--px));
		}

		.lead {
			font-size: calc(20 * var(--tx));
		}

		.line {
			gap: calc(8 * var(--px));
			font-size: calc(17 * var(--tx));
		}

		.chip {
			height: calc(24 * var(--tx));
			padding: 0 calc(8 * var(--tx));
			border-width: calc(1.5 * var(--px));
			font-size: calc(10 * var(--tx));
		}
	}
</style>
