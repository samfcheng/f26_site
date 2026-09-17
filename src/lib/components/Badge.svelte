<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { badgeSettings } from '$lib/badge/settings.js';
  const noFilter = $derived(page.url.searchParams.has('nofilter'));
  const settings = $derived(noFilter ? {
    ...badgeSettings,
    filters: { ...badgeSettings.filters, enabled: false },
    plotter: { ...badgeSettings.plotter, enabled: false }
  } : badgeSettings);
  let canvas;
  let status = $state('loading');
  onMount(() => {
    let cancelled = false, scene;
    import('$lib/badge/badge-scene.js')
      .then(({ createBadgeScene }) => cancelled ? null : createBadgeScene(canvas, () => settings, value => { if (!cancelled) status = value; }))
      .then(value => { if (cancelled) value?.dispose(); else scene = value; })
      .catch(error => { if (!cancelled) { status = 'error'; console.error('Badge could not start:', error); } });
    return () => { cancelled = true; scene?.dispose(); };
  });
</script>

<div class="badge">
  {#if status === 'error'}
    <img class="fallback" src="/assets/badge2.png" alt="Sam Cheng badge" />
  {/if}
  <canvas bind:this={canvas} data-state={status} aria-label="Sam Cheng’s interactive badge. Drag to move it."></canvas>
</div>

<style>
  .badge { position: absolute; inset: 0; z-index: 2; }
  canvas { width: 100%; height: 100%; display: block; touch-action: pan-y; }
  .fallback { position: absolute; width: 20%; height: 48%; object-fit: contain; left: 40%; top: 30%; }
</style>
