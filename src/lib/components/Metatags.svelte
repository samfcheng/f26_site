<script>
	/**
	 * The page's title and its share card — one place, so a route that wants a
	 * different title says so rather than each one assembling its own head.
	 *
	 * `image` is absolute on purpose: a crawler fetching the card has no page to
	 * resolve a relative path against, so it has to carry the origin. The favicon
	 * is not here — it belongs to every route, including the ones that never
	 * render this, so the layout carries it.
	 *
	 * `video` is an optional looping MP4 for previews that play one (iMessage,
	 * Discord, Telegram…). It's 1200×630 like the card, and the image stays
	 * as the fallback everywhere else.
	 *
	 * @typedef {{ title?: string, description?: string, image?: string, video?: string }} Props
	 */

	/** @type {Props} */
	let {
		title = 'Sam Cheng',
		description = 'Sam Cheng is a designer & founder building impactful products with innovative design.',
		image = 'https://www.samfcheng.com/card.png',
		video
	} = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="www.samfcheng.com" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	{#if video}
		<meta property="og:video" content={video} />
		<meta property="og:video:secure_url" content={video} />
		<meta property="og:video:type" content="video/mp4" />
		<meta property="og:video:width" content="1200" />
		<meta property="og:video:height" content="630" />
	{/if}
</svelte:head>
