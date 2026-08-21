<script>
	import IconMenu2 from '@tabler/icons-svelte/icons/menu-2';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarResizer from '$lib/components/SidebarResizer.svelte';
	import Deck from '$lib/components/Deck.svelte';
	import PresentButton from '$lib/components/present/PresentButton.svelte';
	import { deck, setDeck } from '$lib/deck.svelte.js';
	import { chrome, isMobile, restoreChrome } from '$lib/layout.svelte.js';
	import { present } from '$lib/present.svelte.js';
	import { slides } from '$lib/slides/index.js';

	setDeck(deck);

	const mobile = $derived(isMobile());

	let sidebarOpen = $state(true);

	$effect(() => {
		restoreChrome();
	});

	// The slide list is a permanent column on desktop and an overlay on mobile,
	// so crossing the breakpoint resets it rather than carrying state across.
	$effect(() => {
		sidebarOpen = !isMobile();
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

<svelte:head>
	<title>Sam Cheng</title>
	<meta name="description" content="Sam Cheng — portfolio" />
</svelte:head>

<svelte:window {onkeydown} />

<div class="app" class:mobile style:--sidebar-w="{chrome.sidebarWidth}px">
	{#if mobile && sidebarOpen}
		<button class="scrim" onclick={() => (sidebarOpen = false)} aria-label="Close slide list"
		></button>
	{/if}

	<div class="sidebar-slot" class:closed={!sidebarOpen}>
		<Sidebar
			onToggle={() => (sidebarOpen = false)}
			onnavigate={() => mobile && (sidebarOpen = false)}
		/>
		{#if !mobile}
			<SidebarResizer />
		{/if}
	</div>

	{#if !sidebarOpen}
		<button
			class="icon-button floating"
			onclick={() => (sidebarOpen = true)}
			aria-label="Show slide list"
		>
			<IconMenu2 size={20} stroke={1.75} />
		</button>
	{/if}

	<div class="deck-area">
		<Deck />
		<PresentButton onpresent={start} />
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
		transition: margin-left 260ms var(--ease-out);
	}

	.sidebar-slot.closed {
		margin-left: calc(var(--sidebar-w) * -1);
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
		margin-left: 0;
		transform: translateX(0);
		transition: transform 240ms var(--ease-out);
	}

	.app.mobile .sidebar-slot.closed {
		margin-left: 0;
		transform: translateX(-100%);
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 25;
		border: 0;
		padding: 0;
		background: rgb(0 0 0 / 0.2);
		cursor: pointer;
	}

	.floating {
		position: fixed;
		top: 14px;
		left: 14px;
		z-index: 20;
		border-radius: var(--radius-sm);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}
</style>
