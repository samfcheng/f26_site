<script>
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  // `rail` is the full timeline, placed by the page. `pill` is a compact
  // button pinned to the bottom of the screen that opens the same timeline.
  let { sections, variant = 'rail' } = $props();

  // Each row is a fixed height, so dot i sits at i × ROW down the track.
  const ROW = 32;
  // Sections passed, as a fraction: 1.5 is halfway from the second section to
  // the third. -1 until the first section reaches the reading line.
  let progress = $state(-1);
  // 1 when moving down the page, -1 when moving back up.
  let direction = $state(1);
  // The pill's section name rolls: the new one rises in from below while the
  // old one leaves upward, and the reverse when scrolling back up.
  // The name's width eases to fit each new section instead of snapping.
  // Every name but the longest shares one width (the second-longest), so the
  // pill only resizes for the one section that doesn't fit.
  let labelWidth = $state();
  let sharedWidth = 0, currentSlot;
  const sizers = [];
  const fit = () => { if (currentSlot) labelWidth = Math.max(currentSlot.offsetWidth, sharedWidth); };
  const measure = node => { currentSlot = node; fit(); };
  // Measure once the web font has loaded; fallback-font widths are narrower.
  onMount(() => {
    document.fonts.ready.then(() => {
      const widths = sizers.filter(Boolean).map(node => node.offsetWidth).sort((a, b) => b - a);
      sharedWidth = widths[1] ?? widths[0] ?? 0;
      fit();
    });
  });
  function roll(node, { from }) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      duration: reduced ? 150 : 380,
      easing: cubicOut,
      css: t => `opacity:${t};transform:translateY(${reduced ? 0 : (1 - t) * 100 * from}%)`
    };
  }
  const current = $derived(Math.floor(progress));
  const overall = $derived(Math.max(0, progress) / (sections.length - 1));
  // How far through the current section the reader is, 0–1, for the pill's bar.
  let withinSection = $state(0);
  // The pill shows from the first section until the last one has scrolled
  // mostly out of view.
  let finished = $state(false);
  const visible = $derived(progress >= 0 && !finished);
  let open = $state(false);
  let pill;

  // Glide to the section instead of jumping, and keep the URL hash in sync.
  function jump(event, id) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(history.state, '', `#${id}`);
  }

  function dismiss(event) {
    if (open && (event.key === 'Escape' || (event.type === 'pointerdown' && !pill.contains(event.target)))) open = false;
  }

  onMount(() => {
    let frame;
    const update = () => {
      frame = undefined;
      const line = scrollY + innerHeight / 3;
      const tops = sections.map(({ id }) => document.getElementById(id).getBoundingClientRect().top + scrollY);
      let value = -1;
      tops.forEach((top, i) => {
        if (line < top) return;
        const next = tops[i + 1];
        value = next === undefined ? i : i + Math.min(1, (line - top) / (next - top));
      });
      if (Math.floor(value) !== Math.floor(progress)) direction = value > progress ? 1 : -1;
      progress = value;
      // The last section has no next top; measure it against its own bottom.
      const last = document.getElementById(sections.at(-1).id).getBoundingClientRect();
      withinSection = value < 0 ? 0 : value < sections.length - 1 ? value % 1 : Math.min(1, Math.max(0, (innerHeight / 3 - last.top) / last.height));
      finished = last.bottom < innerHeight * .6;
      if (!visible) open = false;
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
    return () => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });
</script>

<svelte:window onkeydown={dismiss} onpointerdown={dismiss} />

{#snippet timeline()}
  <nav class="timeline" aria-label="In this case study" style:--row="{ROW}px" style:--span={sections.length - 1} style:--progress={overall}>
    <span class="track" aria-hidden="true"><span class="fill"></span></span>
    <ol>
      {#each sections as section, i}
        <li class:reached={i <= progress} class:current={i === current}>
          <a href="#{section.id}" onclick={event => jump(event, section.id)} aria-current={i === current ? 'location' : undefined}>
            <span class="dot" aria-hidden="true"></span>
            <span class="number">{section.number}</span>{section.label}
          </a>
        </li>
      {/each}
    </ol>
  </nav>
{/snippet}

{#if variant === 'rail'}
  {@render timeline()}
{:else}
  <div class="pill" class:visible class:open bind:this={pill} inert={!visible}>
    <div class="panel" id="timeline-panel" inert={!open}>{@render timeline()}</div>
    <button type="button" aria-expanded={open} aria-controls="timeline-panel" onclick={() => open = !open}>
      <span class="label" style:width={labelWidth === undefined ? null : `${labelWidth}px`}>
        {#key current}
          <span class="slot" use:measure in:roll={{ from: direction }} out:roll={{ from: -direction }}>
            <span class="number">{sections[Math.max(0, current)].number}</span>{sections[Math.max(0, current)].label}
          </span>
        {/key}
      </span>
      <span class="bar" aria-hidden="true"><span style:transform="scaleX({withinSection})"></span></span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
      <span class="visually-hidden">— show all sections</span>
      <span class="sizers" aria-hidden="true">
        {#each sections as section, i}<span bind:this={sizers[i]}><span class="number">{section.number}</span>{section.label}</span>{/each}
      </span>
    </button>
  </div>
{/if}

<style>
  /* Colours are tokens so the pill's dark panel can invert them. */
  .timeline{position:relative;--ink:#080808;--muted:#77747f;--line:#d6d2de;--ring:#bdb7c9;--surface:#fafafa}
  /* The grey track runs from the first dot to the last; the black fill grows
     down it with the scroll. Dots sit above both. */
  .track{position:absolute;left:4px;top:calc(var(--row) / 2);width:1px;height:calc(var(--row) * var(--span));background:var(--line)}
  .fill{position:absolute;inset:0;background:var(--ink);transform-origin:top;transform:scaleY(var(--progress))}
  ol{list-style:none;margin:0;padding:0}
  li{position:relative;height:var(--row)}
  a{display:flex;align-items:center;height:100%;padding-left:24px;font-size:14px;line-height:1;white-space:nowrap;color:var(--muted);transition:color .2s ease}
  a:hover,.current a{color:var(--ink)}
  /* The fill grows out from the centre of the dot when its section is reached,
     and shrinks back into it when you scroll above it again. */
  .dot{position:absolute;z-index:1;left:0;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;border:1px solid var(--ring);background:var(--surface);transition:border-color .2s ease}
  .dot::after{content:"";position:absolute;inset:-1px;border-radius:50%;background:var(--ink);transform:scale(0);transition:transform .35s var(--ease-out)}
  .reached .dot{border-color:var(--ink)}
  .reached .dot::after{transform:scale(1)}
  .number{margin-right:10px;font-variant-numeric:tabular-nums}

  /* Pill: slides up once reading starts, and opens upward into the timeline. */
  /* A short rise with a soft focus pull, rather than sliding the full height. */
  .pill{position:fixed;z-index:20;left:50%;bottom:20px;display:flex;flex-direction:column;align-items:center;gap:8px;transform-origin:50% 100%;transform:translate(-50%,24px) scale(.96);opacity:0;filter:blur(4px);transition:transform .7s var(--ease-out),opacity .5s ease,filter .5s ease}
  .pill.visible{transform:translate(-50%,0);opacity:1;filter:none}
  button{display:flex;align-items:center;padding:12px 16px 12px 20px;border:0;border-radius:999px;background:#080808;color:#fff;font-size:15px;line-height:1;cursor:pointer;box-shadow:0 4px 16px #00000026;outline-offset:3px}
  button .number{opacity:.55}
  /* Incoming and outgoing names share one grid cell, clipped to a single line. */
  .label{flex:none;display:grid;overflow:hidden;text-align:left;white-space:nowrap;margin-right:16px;padding-block:2px;transition:width .45s cubic-bezier(.65,0,.35,1)}
  .slot{grid-area:1/1;justify-self:start}
  /* Invisible copies of every name, used only to measure widths. */
  .sizers{position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap}
  .sizers>span{position:absolute}
  .bar{position:relative;width:48px;height:2px;margin-right:12px;border-radius:2px;background:#ffffff40;overflow:hidden}
  .bar span{position:absolute;inset:0;background:#fff;transform-origin:left}
  svg{transform:rotate(0);transition:transform .25s var(--ease-out)}
  .open svg{transform:rotate(180deg)}
  .panel{padding:14px 20px;border-radius:16px;background:#080808;box-shadow:0 4px 16px #00000026;transform-origin:bottom center;transform:translateY(8px) scale(.96);opacity:0;visibility:hidden;transition:transform .25s var(--ease-out),opacity .2s ease,visibility 0s .25s}
  .open .panel{transform:none;opacity:1;visibility:visible;transition:transform .25s var(--ease-out),opacity .2s ease}
  .panel .timeline{--ink:#fff;--muted:#a19dab;--line:#ffffff33;--ring:#ffffff59;--surface:#080808}
  .visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  @media(prefers-reduced-motion:reduce){a,.dot,.dot::after,.pill,.panel,.label,svg{transition:none}.pill{transform:translate(-50%,0);filter:none}}
</style>
