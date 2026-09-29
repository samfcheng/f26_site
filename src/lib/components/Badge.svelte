<script>
  import { page } from '$app/state';
  import { badgeSettings } from '$lib/badge/settings.js';
  const noFilter = $derived(!page.url.searchParams.has('filter'));
  const badgeImage = $derived(noFilter ? '/assets/badge_nofilter.png' : '/assets/badge2.png');
  // Captures of the scene's first frame, before physics runs. Cropped to the
  // same box so one set of positioning rules covers both.
  const stillImage = $derived(noFilter ? '/assets/badge-still.webp' : '/assets/badge-still-filter.webp');
  const settings = $derived(noFilter ? {
    ...badgeSettings,
    material: { ...badgeSettings.material, unlitArtwork: true, wear: .2 },
    lighting: { ...badgeSettings.lighting, reflections: .9 },
    filters: { ...badgeSettings.filters, enabled: false },
    plotter: { ...badgeSettings.plotter, enabled: false }
  } : badgeSettings);
  let canvas;
  let status = $state('loading');
  let ready = $state(false);
  $effect(() => {
    const cardUrl = badgeImage;
    let cancelled = false, scene, idle, frame;
    ready = false;
    // Wait for the rest of the page before pulling in three.js, Rapier, and
    // the card texture; the still image stands in until then.
    const start = () => {
      idle = (window.requestIdleCallback ?? (fn => setTimeout(fn, 1)))(() => {
        import('$lib/badge/badge-scene.js')
          .then(({ createBadgeScene }) => cancelled ? null : createBadgeScene(canvas, () => settings, value => { if (!cancelled) status = value; }, cardUrl))
          .then(value => {
            if (cancelled) return value?.dispose();
            scene = value;
            // The scene schedules its first render as it resolves; swap once
            // that frame is on screen.
            frame = requestAnimationFrame(() => frame = requestAnimationFrame(() => ready = true));
          })
          .catch(error => { if (!cancelled) { status = 'error'; console.error('Badge could not start:', error); } });
      }, { timeout: 1500 });
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      if (idle !== undefined) (window.cancelIdleCallback ?? clearTimeout)(idle);
      cancelAnimationFrame(frame);
      scene?.dispose();
    };
  });
</script>

<div class="badge">
  <img class="still" class:hidden={ready} src={stillImage} alt={ready ? '' : 'Sam Cheng badge'} width="704" height="1768" fetchpriority="high" decoding="async" />
  <canvas bind:this={canvas} class:hidden={!ready} data-state={status} aria-label="Sam Cheng’s interactive badge. Drag to move it."></canvas>
</div>

<style>
  /* The still sits where the camera frames the badge: its size tracks the
     hero's height (fixed vertical FOV) and it is centred horizontally. */
  .badge { position: absolute; inset: 0; z-index: 2; container-type: size; }
  canvas { width: 100%; height: 100%; display: block; touch-action: pan-y; }
  .still { position: absolute; top: 0; left: calc(50% - 15.6cqh); width: 35.2cqh; height: 88.4cqh; pointer-events: none; user-select: none; }
  .hidden { visibility: hidden; }
</style>
