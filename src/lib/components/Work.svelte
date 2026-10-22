<script>
  import { page } from '$app/state';
  import { projects } from '$lib/projects.js';
  const noFilter = $derived(!page.url.searchParams.has('filter'));
  let hovered = $state(null), focused = $state(null);
  const active = $derived(hovered ?? focused);
  let animateLabels = $state.raw(null);
  $effect(() => { animateLabels?.setActive(active); });
  let ready = $state(false);
  let section;
  $effect(() => {
    if (noFilter) {
      animateLabels?.dispose(); animateLabels = null; ready = false;
      return;
    }
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
  /** On phones, which image each project's strip is snapped to. */
  let slides = $state(projects.map(() => 0));
  function snapped(event, index) {
    const strip = event.currentTarget;
    slides[index] = Math.round(strip.scrollLeft / (strip.firstElementChild.offsetWidth + 8));
  }
</script>

<section id="work" aria-label="Selected work" bind:this={section} class:has-active={active !== null} class:plotter-ready={ready} class:no-filter={noFilter}>
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
  <!-- Phones: no hover, so every project shows all three previews in a
       swipeable row, with its copy and a link underneath. -->
  {#each projects as project, index}
    <article class="entry" aria-labelledby="{project.slug}-title">
      <header>
        <h2 id="{project.slug}-title"><a href="/work/{project.slug}">{project.name}</a></h2>
        <p class="date">{project.date}</p>
      </header>
      <div class="strip" onscroll={event => snapped(event, index)}>
        {#each project.images as image, imageIndex}
          <a class="slide" href="/work/{project.slug}" tabindex="-1" aria-hidden={imageIndex > 0}>
            <img src={image} alt={imageIndex === 0 ? `${project.name} preview` : ''} width="890" height="676" loading="lazy" decoding="async" />
          </a>
        {/each}
      </div>
      <div class="dots" aria-hidden="true">
        {#each project.images as _, imageIndex}<span class:on={slides[index] === imageIndex}></span>{/each}
      </div>
      <p class="description">{project.description}</p>
      <a class="read" href="/work/{project.slug}">Read case study <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
    </article>
  {/each}
</section>

<style>
  section{padding:104px 0 136px;overflow:clip;scroll-margin-top:48px}
  .project{position:relative;display:flex;align-items:center;min-height:280px;border-top:1px solid #eaeaea;padding:40px var(--page-gutter);isolation:isolate}
  .project:last-child{border-bottom:1px solid #eaeaea}
  .project::before{content:'';position:absolute;inset:0;background:white;opacity:0;z-index:-1;transition:opacity 180ms ease}
  .project.active{z-index:10}.project.active::before{opacity:1}
  .label{position:relative;width:340px;max-width:100%}.copy{padding:8px 0;transition:opacity 180ms ease,filter 180ms ease}
  h2{font-size:48px;line-height:1.2;letter-spacing:-.02em;margin-bottom:16px}
  p{font-size:16px;line-height:1.28;letter-spacing:-.02em}p+p{margin-top:12px}
  .date{opacity:.5}
  canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;transition:opacity 180ms ease}
  .muted .copy{opacity:.35}.plotter-ready .muted .copy{opacity:0}.plotter-ready .muted canvas{opacity:.4}
  .no-filter .muted .copy{filter:blur(4px)}
  .previews{position:absolute;z-index:20;left:calc(var(--page-gutter) + 376px);top:50%;transform:translateY(-50%);right:var(--page-gutter);height:190px;pointer-events:none}
  .preview{position:absolute;width:250px;height:190px;object-fit:cover;background:#fff;background-clip:padding-box;border:1px solid rgb(0 0 0 / 0.1);border-radius:4px;opacity:0;transform:translateY(64px) rotate(0) scale(.95);transition:transform 250ms var(--ease-out),opacity 160ms ease}
  .preview-0{right:calc(2 * max(0px, min(225px, (100% - 250px) / 2)));top:0}.preview-1{right:max(0px, min(225px, (100% - 250px) / 2));top:8px}.preview-2{right:0;top:8px}
  .active .preview{opacity:1}.active .preview-0{transform:translateY(0) rotate(-8deg)}.active .preview-1{transform:translateY(0) rotate(10deg);transition-delay:35ms}.active .preview-2{transform:translateY(0) rotate(-7.2deg);transition-delay:70ms}
  .project:focus-visible{outline-offset:-5px}.project:focus-visible .preview{transition:none}
  @media(prefers-reduced-motion:reduce){.preview{transition:opacity 160ms ease;transform:none!important}.active .preview{transition-delay:0ms}}
  .entry{display:none}
  @media(max-width:700px){
    section{padding:24px 0 40px}
    .project{display:none}
    .entry{display:block;padding:40px 0 44px;border-top:1px solid #eaeaea}
    .entry:last-child{border-bottom:1px solid #eaeaea}
    header{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:0 24px;margin-bottom:20px}
    h2{font-size:32px;margin-bottom:0}
    .date{white-space:nowrap}
    .strip{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:24px;padding:0 24px;overscroll-behavior-x:contain;scrollbar-width:none}
    .strip::-webkit-scrollbar{display:none}
    .slide{flex:0 0 calc(100% - 56px);scroll-snap-align:start;-webkit-tap-highlight-color:transparent}
    .slide img{display:block;width:100%;height:auto;aspect-ratio:890/676;object-fit:cover;background:#fff;background-clip:padding-box;border:1px solid rgb(0 0 0 / .1);border-radius:4px}
    .dots{display:flex;gap:6px;padding:14px 24px 0}
    .dots span{width:6px;height:6px;border-radius:999px;background:#080808;opacity:.15;transition:opacity 200ms ease,width 250ms var(--ease-out)}
    .dots .on{width:16px;opacity:.8}
    .description{padding:0 24px;margin-top:20px;line-height:1.38}
    .read{display:inline-flex;align-items:center;gap:6px;margin:16px 24px 0;padding:8px 14px 9px;border-radius:999px;background:#080808;color:#fff;font-size:15px;letter-spacing:-.01em;transition:transform 160ms var(--ease-out)}
    .read:active{transform:scale(.97)}
  }
  @media(max-width:700px) and (prefers-reduced-motion:reduce){.dots span{transition:none}}
</style>
