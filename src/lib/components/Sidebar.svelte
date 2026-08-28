<script>
	import SidebarItem from './SidebarItem.svelte';
	import PresentButton from './present/PresentButton.svelte';
	import { getDeck } from '$lib/deck.svelte.js';
	import {
		EASE_IN_OUT,
		hoverOffset,
		motion,
		moveMs,
		selectMs,
		staggerMs,
		stackHeight,
		stackTransform
	} from '$lib/motion.svelte.js';

	let { onpresent, onnavigate = () => {} } = $props();

	const deck = getDeck();

	/** @type {HTMLElement | undefined} */
	let list = $state();

	let listWidth = $state(0);
	let thumbWidth = $state(0);
	let thumbHeight = $state(0);
	let pitch = $state(0);

	let selectionTop = $state(0);
	let selectionHeight = $state(0);
	let selectionReady = $state(false);

	/** Id of the collapsed group currently under the pointer. */
	let hovered = $state('');

	// The selection is one block that slides between rows rather than a fill that
	// pops on and off each row. When the selected row is a collapsed parent the
	// block grows to wrap its stack, and shrinks back as the group opens.
	function measureSelection() {
		const id = deck.activeId;
		const row = /** @type {HTMLElement | null} */ (list?.querySelector(`[data-item="${id}"]`));
		if (!row || !list) return;

		// Offsets are taken from rects, not `offsetTop`: a sub-slide row's offset
		// parent is its group wrapper, not the list.
		const listBox = list.getBoundingClientRect();
		const rowBox = row.getBoundingClientRect();

		// The stack's height is computed, never measured: mid-collapse the group
		// wrapper is still most of the way to its expanded height, and measuring
		// it there leaves the selection stretched over the whole group.
		// The stack falls inside the row's own bottom padding, so only the part
		// hanging below it is extra — that keeps the fill's padding even on all
		// four sides.
		const children = deck.slides.find((s) => s.id === id)?.children?.length ?? 0;
		const stack =
			children && deck.isCollapsed(id)
				? stackHeight(children, motion.thumbPeek, motion.maxStack)
				: 0;

		selectionTop = rowBox.top - listBox.top + list.scrollTop;
		selectionHeight = rowBox.height + stack;
		selectionReady = true;
	}

	// Measured from a real row, so the stack geometry can't drift from the CSS.
	//
	// Watched rather than read once per list width: a thumbnail also changes
	// height when the window crosses a breakpoint and the slide canvas changes
	// shape — 16:9 to square to portrait — and the list is exactly as wide
	// either side of that. Geometry measured before the change is what leaves
	// the sub-slides hanging below their parent instead of tucked behind it.
	$effect(() => {
		const row = list?.querySelector('.row');
		const thumb = row?.querySelector('.thumb');
		if (!row || !thumb) return;

		const measure = () => {
			const box = thumb.getBoundingClientRect();
			thumbWidth = box.width;
			thumbHeight = box.height;
			pitch = row.getBoundingClientRect().height + parseFloat(getComputedStyle(row).marginBottom);
		};

		// The list is watched as well as the thumbnail: it re-centres its rows as
		// it changes height, so a shorter window moves every row without any of
		// them changing size — and the selection block, which is placed against a
		// row, has to come along.
		const remeasure = () => {
			measure();
			measureSelection();
		};

		measure();
		const observer = new ResizeObserver(remeasure);
		observer.observe(thumb);
		if (list) observer.observe(list);
		return () => observer.disconnect();
	});

	$effect(() => {
		// Re-measure when rows move, not only when the selection changes.
		deck.activeId;
		deck.slides.map((s) => deck.isCollapsed(s.id)).join();
		listWidth;
		pitch;
		motion.thumbPeek;
		motion.maxStack;

		measureSelection();
		list?.querySelector(`[data-item="${deck.activeId}"]`)?.scrollIntoView({ block: 'nearest' });
	});

	// While a group is opening or closing the rows are still moving — and the
	// list re-centres itself as its content changes height — so the block has to
	// follow them frame by frame rather than animate to a stale position.
	$effect(() => {
		if (!deck.settling) return;

		let frame = requestAnimationFrame(function track() {
			measureSelection();
			frame = requestAnimationFrame(track);
		});

		return () => cancelAnimationFrame(frame);
	});
</script>

<aside class="sidebar">
	<header>
		<div class="wordmark">
			<img src="/assets/logo_name.svg" alt="Sam Cheng" />
		</div>
		<!-- Opens to the right: the menu is wider than the sidebar, so an
		     end-aligned one would be cut off at the window edge. -->
		<PresentButton {onpresent} align="start" />
	</header>

	<div class="list" bind:this={list} bind:clientWidth={listWidth}>
		{#if selectionReady}
			<!-- Mounted only once measured: an element's first computed style never
			     transitions, so it appears in place instead of sliding in from 0. -->
			<div
				class="selection"
				style:height="{selectionHeight}px"
				style:transform="translateY({selectionTop}px)"
				style:transition={deck.settling
					? 'none'
					: `transform ${selectMs()}ms ${EASE_IN_OUT}, height ${selectMs()}ms ${EASE_IN_OUT}`}
				aria-hidden="true"
			></div>
		{/if}

		{#each deck.slides as slide (slide.id)}
			<SidebarItem
				{slide}
				label={deck.numberOf(slide.id)}
				{onnavigate}
				onhover={(/** @type {boolean} */ on) => (hovered = on ? slide.id : '')}
			/>

			{#if slide.children?.length}
				{@const collapsed = deck.isCollapsed(slide.id)}
				{@const n = slide.children.length}
				<div
					class="children"
					class:ready={pitch > 0}
					inert={collapsed}
					style:height="{collapsed
						? stackHeight(n, motion.thumbPeek, motion.maxStack)
						: n * pitch}px"
					style:transition="height {moveMs()}ms {motion.deckEasing}"
				>
					{#each slide.children as child, j (child.id)}
						{@const stack = stackTransform(
							j,
							thumbHeight,
							thumbWidth,
							pitch,
							motion.thumbPeek,
							motion.maxStack
						)}
						<SidebarItem
							slide={child}
							label={deck.numberOf(child.id)}
							{onnavigate}
							stacked={collapsed}
							hovered={collapsed && hovered === slide.id}
							depth={stack.depth}
							z={n - j}
							delay={j * staggerMs()}
							offset={stack.offset}
							transform={collapsed ? stack.transform : ''}
							lift={collapsed && hovered === slide.id ? hoverOffset(stack.depth, motion.thumbHoverLift) : 0}
						/>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-w, 250px);
		flex: none;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--line);
	}

	header {
		/* Above the list, which is its own stacking context — otherwise the
		   present menu opens behind the thumbnails. */
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 0 14px 0 20px;
		height: 64px;
		flex: none;
		border-bottom: 1px solid var(--line);
	}

	.wordmark {
		display: inline-flex;
		align-items: center;
		/* Shrinks with the sidebar rather than pushing the button out of it. */
		min-width: 0;
	}

	/* Part of the parked dark theme — see the note in app.css. Pure black
	   artwork, so one invert is the whole dark treatment for it. */
	:global(:root[data-theme='dark']) .wordmark img {
		filter: invert(1);
	}

	.wordmark img {
		display: block;
		height: 14px;
		max-width: 100%;
		object-fit: contain;
		object-position: left center;
	}

	.list {
		flex: 1;
		/* Stacking context so the selection block (z-index: -1) paints above the
		   sidebar's background but below every thumbnail. */
		position: relative;
		z-index: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		scroll-padding-block: 28px;
		scrollbar-width: none;
		padding-block: 20px;
		display: flex;
		flex-direction: column;
		/* Centred while the thumbnails fit, top-aligned once they overflow —
		   `safe` is what stops the first row being clipped past the scroll top. */
		justify-content: safe center;
	}

	.list::-webkit-scrollbar {
		display: none;
	}

	.selection {
		position: absolute;
		top: 0;
		left: 10px;
		right: 10px;
		z-index: -1;
		border-radius: var(--radius-lg);
		background: var(--selected);
	}

	/* Holds a group's sub-slide rows. Collapsed, it is just tall enough for the
	   stack to peek below the parent thumbnail; expanded, it is the full height
	   of its rows. */
	.children {
		position: relative;
		z-index: 0;
		flex: none;
		visibility: hidden;
	}

	.children.ready {
		visibility: visible;
	}
</style>
