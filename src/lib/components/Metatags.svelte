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
	 * @typedef {{ title?: string, description?: string, image?: string }} Props
	 */

	/** @type {Props} */
	let {
		title = 'Sam Cheng',
		description = 'Sam Cheng is a designer & founder building impactful products with innovative design.',
		image = 'https://www.samfcheng.com/card.png'
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
</svelte:head>
