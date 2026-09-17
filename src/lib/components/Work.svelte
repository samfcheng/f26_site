<script>
  import { onMount } from 'svelte';
  import { projects } from '$lib/projects.js';
  let hovered = $state(null), focused = $state(null);
  const active = $derived(hovered ?? focused);
  let animateLabels = $state.raw(null);
  $effect(() => { animateLabels?.setActive(active); });
  let ready = $state(false);
  let section;
  onMount(() => {
    let cancelled = false, timer;
    async function draw() {
      if (matchMedia('(max-width: 700px)').matches) {
        animateLabels?.dispose(); animateLabels = null; ready = false;
        return;
      }
      await document.fonts.ready;
      const { renderPlotterLabels } = await import('$lib/plotter-text.js');
      if (cancelled) return;
      try {
        animateLabels?.dispose();
        animateLabels = renderPlotterLabels([...section.querySelectorAll('.project')].map(row => ({ source: row.querySelector('.copy'), target: row.querySelector('canvas') })));
        ready = true;
      } catch (error) { console.warn('Plotter text unavailable:', error); }
    }
    const observer = new ResizeObserver(() => { clearTimeout(timer);timer = setTimeout(draw, 150); });
    observer.observe(section);
    return () => { cancelled = true;clearTimeout(timer);observer.disconnect();animateLabels?.dispose(); };
  });
  function enter(index) { if (matchMedia('(hover: hover) and (pointer: fine)').matches) hovered = index; }
</script>

<section id="work" aria-label="Selected work" bind:this={section} class:has-active={active !== null} class:plotter-ready={ready}>
  {#each projects as project, index}
    <a class="project" class:active={active === index} class:muted={active !== null && active !== index}
      href="/work/{project.slug}" onpointerenter={() => enter(index)} onpointerleave={() => hovered = null}
      onfocus={() => focused = index} onblur={() => focused = null}>
      <div class="label">
        <div class="copy">
          <h2 data-line>{project.name}</h2>
          <p data-line>{project.description}</p>
          <p class="date" data-line>{project.date}</p>
        </div>
        <canvas aria-hidden="true"></canvas>
      </div>
      <div class="previews" aria-hidden="true">
        {#each project.images as image, imageIndex}
          <img src={image} alt="" width="890" height="676" class="preview preview-{imageIndex}" />
        {/each}
      </div>
    </a>
  {/each}
</section>

<style>
  section{padding:104px 0 136px;overflow:clip;scroll-margin-top:48px}
  .project{position:relative;display:flex;align-items:center;min-height:280px;border-top:1px solid #eaeaea;padding:40px var(--page-gutter);isolation:isolate}
  .project:last-child{border-bottom:1px solid #eaeaea}
  .project::before{content:'';position:absolute;inset:0;background:white;opacity:0;z-index:-1;transition:opacity 180ms ease}
  .project.active{z-index:10}.project.active::before{opacity:1}
  .label{position:relative;width:340px;max-width:100%}.copy{padding:8px 0;transition:opacity 180ms ease}
  h2{font-size:48px;line-height:1.2;letter-spacing:-.02em;margin-bottom:16px}
  p{font-size:16px;line-height:1.28;letter-spacing:-.02em}p+p{margin-top:12px}
  .date{opacity:.5}
  canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;transition:opacity 180ms ease}
  .muted .copy{opacity:.35}.plotter-ready .muted .copy{opacity:0}.plotter-ready .muted canvas{opacity:.4}
  .previews{position:absolute;z-index:20;left:calc(var(--page-gutter) + 376px);top:50%;transform:translateY(-50%);right:var(--page-gutter);height:190px;pointer-events:none}
  .preview{position:absolute;width:250px;height:190px;object-fit:cover;background:#fff;border:1px solid rgb(0 0 0 / 0.1);opacity:0;transform:translateY(64px) rotate(0) scale(.95);transition:transform 250ms var(--ease-out),opacity 160ms ease}
  .preview-0{right:calc(2 * max(0px, min(225px, (100% - 250px) / 2)));top:0}.preview-1{right:max(0px, min(225px, (100% - 250px) / 2));top:8px}.preview-2{right:0;top:8px}
  .active .preview{opacity:1}.active .preview-0{transform:translateY(0) rotate(-8deg)}.active .preview-1{transform:translateY(0) rotate(10deg);transition-delay:35ms}.active .preview-2{transform:translateY(0) rotate(-7.2deg);transition-delay:70ms}
  .project:focus-visible{outline-offset:-5px}.project:focus-visible .preview{transition:none}
  @media(prefers-reduced-motion:reduce){.preview{transition:opacity 160ms ease;transform:none!important}.active .preview{transition-delay:0ms}}
  @media(max-width:700px){
    section{padding:48px 0 56px}
    .project{display:block;min-height:0;padding:32px 24px}
    .label{width:100%}
    h2{font-size:32px;margin-bottom:12px}
    .previews{position:relative;inset:auto;height:auto;margin-top:24px;transform:none;z-index:auto}
    .preview{display:none;position:static;width:100%;height:auto;object-fit:contain;opacity:1;transform:none!important;transition:none}
    .preview-0{display:block}
    .muted .copy,.plotter-ready .muted .copy{opacity:1}
    .label canvas{display:none}
  }
</style>
