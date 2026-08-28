<script>
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarResizer from '$lib/components/SidebarResizer.svelte';
	import Deck from '$lib/components/Deck.svelte';
	import Metatags from '$lib/components/Metatags.svelte';
	import { deck, setDeck } from '$lib/deck.svelte.js';
	import { chrome, isMobile, restoreChrome } from '$lib/layout.svelte.js';
	import { present } from '$lib/present.svelte.js';
	import { slides } from '$lib/slides/index.js';

	setDeck(deck);

	const mobile = $derived(isMobile());

	$effect(() => {
		restoreChrome();
	});

	/** @param {boolean} withNotes */
	function start(withNotes) {
		present({ from: deck.activeId, notes: withNotes });
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== 'Enter' || !event.altKey || !(event.metaKey || event.ctrlKey)) return;
		event.preventDefault();
		start(event.shiftKey);
	}
</script>

<Metatags />

<svelte:window {onkeydown} />

<div class="app" class:mobile style:--sidebar-w="{chrome.sidebarWidth}px">
	<!-- Mobile is the deck and nothing else: no slide list over the slides, and
	     no show to start from a phone. Scrolling is the whole navigation. -->
	<div class="sidebar-slot" class:closed={mobile}>
		<Sidebar onpresent={start} />
		{#if !mobile}
			<SidebarResizer />
		{/if}
	</div>

	<div class="deck-area">
		<Deck />
	</div>
</div>

<style>
	.app {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	.sidebar-slot {
		position: relative;
		flex: none;
		/* Above the deck: the present menu opens past the sidebar's edge. */
		z-index: 10;
	}

	.deck-area {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.app.mobile .sidebar-slot {
		position: fixed;
		inset: 0 auto 0 0;
		z-index: 30;
		transform: translateX(0);
		transition: transform 240ms var(--ease-out);
	}

	.app.mobile .sidebar-slot.closed {
		transform: translateX(-100%);
	}
</style>
