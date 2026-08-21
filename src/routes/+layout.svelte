<script>
	import favicon from '$lib/assets/favicon.svg';
	import Agentation from '$lib/components/Agentation.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if import.meta.env.DEV}
	<Agentation />
{/if}
