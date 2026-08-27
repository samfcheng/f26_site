<script>
	import '../app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	let { children } = $props();

	injectAnalytics();
</script>

<svelte:head>
	<!-- Every route, including the presenter windows that never render Metatags.
	     The .ico is what a browser tab and a bookmark reach for; the .png is the
	     one anything larger scales from. -->
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="apple-touch-icon" href="/favicon.png" />
</svelte:head>

{@render children()}
