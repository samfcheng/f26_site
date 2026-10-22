<script>
  let { open = $bindable(false) } = $props();

  const experience = [
    { years: '2026 – Now', company: 'Kleiner Perkins', role: 'Design Fellow' },
    { years: '2026', company: 'Multiply', role: 'Product Design' },
    { years: '2023 – 2025', company: 'Independent', role: 'Freelance Designer' },
    { years: '2023 – 2024', company: 'Oracle Education Foundation', role: 'Intern' }
  ];

  let dialog, panel;
  let shown = $state(false);

  // Open: show the dialog, then add `shown` on the next frame so the panel
  // slides in. Close: remove `shown`, and close the dialog once it's out.
  $effect(() => {
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      // Commit the closed position first, so there is something to slide from.
      panel.getBoundingClientRect();
      requestAnimationFrame(() => shown = true);
    } else if (!open && dialog.open) {
      shown = false;
      let done = false;
      const ended = event => { if (event.target === panel) finish(); };
      const finish = () => {
        panel.removeEventListener('transitionend', ended);
        if (done || open) return;
        done = true;
        dialog.close();
        document.documentElement.style.overflow = '';
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
      panel.addEventListener('transitionend', ended);
      // In case the transition never runs (e.g. a background tab).
      setTimeout(finish, 600);
    }
  });

  // On phones the panel is a bottom sheet, and its header drags it. It follows
  // the finger down; upward it resists, rising less the further it's pulled.
  // Released past a quarter of its height or on a flick, it closes; otherwise
  // it settles back. Either way the inline styles are cleared and the CSS
  // transition carries on from wherever the finger let go.
  let pointer = null, startY = 0, offset = 0;
  /** Recent finger positions, for the speed at the moment of release. */
  let samples = [];
  function down(event) {
    if (pointer !== null || event.button > 0 || !matchMedia('(max-width: 700px)').matches) return;
    pointer = event.pointerId;
    startY = event.clientY;
    samples = [{ y: event.clientY, t: event.timeStamp }];
    offset = 0;
    event.currentTarget.setPointerCapture(pointer);
    panel.style.transition = dialog.style.transition = 'none';
  }
  function move(event) {
    if (event.pointerId !== pointer) return;
    const distance = event.clientY - startY;
    samples.push({ y: event.clientY, t: event.timeStamp });
    while (samples.length > 2 && event.timeStamp - samples[0].t > 100) samples.shift();
    offset = distance >= 0 ? distance : -6 * Math.sqrt(-distance);
    panel.style.transform = `translateY(${offset}px)`;
    dialog.style.backgroundColor = `rgb(0 0 0 / ${(.18 * (1 - Math.max(offset, 0) / panel.offsetHeight)).toFixed(3)})`;
  }
  function up(event) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    // Speed over the last tenth of a second, in px/ms: a drag that has
    // stopped doesn't count as a flick, however fast it started.
    const first = samples[0], last = samples.at(-1);
    const velocity = event.timeStamp - last.t > 100 ? 0 : (last.y - first.y) / Math.max(last.t - first.t, 1);
    panel.style.transition = dialog.style.transition = '';
    panel.style.transform = dialog.style.backgroundColor = '';
    if (offset > panel.offsetHeight / 4 || (offset > 0 && velocity > .4)) open = false;
  }

  function cancel(event) {
    event.preventDefault();
    open = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class:shown aria-labelledby="about-title" oncancel={cancel} onclick={event => { if (event.target === dialog) open = false; }}>
  <div class="panel" bind:this={panel}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="drag" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <div class="grab" aria-hidden="true"><span></span></div>
      <header>
        <h2 id="about-title">About</h2>
        <button type="button" class="close" aria-label="Close" onpointerdown={event => event.stopPropagation()} onclick={() => open = false}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </header>
    </div>
    <div class="body">
      <div class="bio">
        <p>I’m a designer studying Arts, Technology, &amp; Business at USC. I like working on a product end to end: talking with the people who use it, sweating the details, and building products people care about.</p>
        <p>This past summer, I was the youngest Kleiner Perkins fellow and Multiply’s first design intern, redesigning the tools their loan officers use every day.</p>
      </div>
      <div class="headshot">
        <img src="/assets/headshot-casual.webp" alt="Sam at night in front of the Bay Bridge in San Francisco." width="1200" height="800" loading="lazy" decoding="async" />
        <img class="subject" src="/assets/headshot-casual-subject.webp" alt="" width="1200" height="800" loading="lazy" decoding="async" />
      </div>
      <section aria-labelledby="experience-title">
        <h3 id="experience-title">Experience</h3>
        <ol class="experience">
          {#each experience as job}
            <li>
              <span class="years">{job.years}</span>
              <span class="company">{job.company}</span>
              <span class="role">{job.role}</span>
            </li>
          {/each}
        </ol>
      </section>
    </div>
  </div>
</dialog>

<style>
  /* `overflow: clip`, not hidden: opening focuses inside the dialog, and a
     merely hidden overflow can still be scrolled to reach it. */
  dialog{--ease-drawer:cubic-bezier(.32,.72,0,1);position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:clip;background-color:rgb(0 0 0 / 0);transition:background-color .4s ease}
  dialog.shown{background-color:rgb(0 0 0 / .12)}
  dialog::backdrop{background:none}
  /* Bio, photo, and experience are spread down the full height, so the
     experience list sits at the bottom; on short screens they stack and scroll. */
  .panel{position:absolute;top:0;left:0;bottom:0;display:flex;flex-direction:column;width:min(520px,100vw);padding:clamp(32px,5vh,56px) 56px;overflow-y:auto;overscroll-behavior:contain;background:#fff;font-weight:400;transform:translateX(-100%);transition:transform .45s var(--ease-out)}
  .shown .panel{transform:none}
  .body{flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:clamp(24px,4vh,40px)}
  .grab{display:none}
  header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px}
  h2{font-size:48px;font-weight:400;line-height:1.1;letter-spacing:-.02em}
  .close{display:grid;place-items:center;width:40px;height:40px;margin:2px -8px 0 0;padding:0;border:0;border-radius:999px;background:none;color:#080808;cursor:pointer;transition:background .15s ease}
  .close:hover{background:#f2f1f4}
  .close:focus-visible{outline:2px solid #7950ef;outline-offset:2px}
  .bio p{font-size:16px;line-height:1.6;color:#5b5864;text-wrap:pretty}
  .bio p+p{margin-top:16px}
  /* The photo gives up height first when the panel is short, cropping from its centre. */
  .headshot{position:relative;overflow:hidden;flex:0 1 auto;min-height:160px;width:100%;aspect-ratio:3/2;border-radius:4px;box-shadow:0 1px 2px #0000000a,0 2px 8px #00000008}
  .headshot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:4px;transition:filter .6s var(--ease-out)}
  /* On hover the background dims a little while a cutout of the subject, laid
     exactly over the photo, fades in slightly brighter. Same timing both ways. */
  .headshot .subject{opacity:0;transition:opacity .6s var(--ease-out),filter .6s var(--ease-out)}
  @media(hover:hover) and (pointer:fine){
    .headshot:hover img:first-child{filter:brightness(.7) saturate(.9)}
    .headshot:hover .subject{opacity:1;filter:brightness(1.12)}
  }
  h3{font-size:16px;font-weight:500;margin:0 0 4px}
  .experience{list-style:none;margin:0;padding:0}
  .experience li{display:grid;grid-template-columns:104px 1fr auto;gap:16px;padding:14px 0;border-bottom:1px solid #eceaf0;font-size:15px;line-height:1.4}
  .years{color:#77747f;font-variant-numeric:tabular-nums}
  .company{color:#080808}
  .role{color:#77747f;text-align:right}
  /* Phones: a bottom sheet on iOS's sheet curve — quick to start, long soft
     landing — for opening, closing, and settling after a drag. */
  @media(max-width:700px){
    dialog{transition:background-color 500ms var(--ease-drawer)}
    dialog.shown{background-color:rgb(0 0 0 / .18)}
    .panel{top:auto;right:0;width:auto;max-height:calc(100dvh - 48px);padding:0;overflow:visible;border-radius:16px 16px 0 0;box-shadow:0 -8px 32px rgb(0 0 0 / .08);transform:translateY(100%);transition:transform 500ms var(--ease-drawer);will-change:transform}
    /* White below the sheet, so pulling it up never shows a gap. */
    .panel::after{content:'';position:absolute;top:100%;left:0;right:0;height:120px;background:#fff}
    .shown .panel{transform:translateY(0)}
    .drag{touch-action:none;user-select:none;-webkit-user-select:none}
    .grab{display:grid;place-items:center;height:28px}
    .grab span{width:36px;height:5px;border-radius:999px;background:#dcdae0}
    header{align-items:center;margin-bottom:0;padding:0 24px 16px}
    h2{font-size:38px}
    .close{margin:0 -8px 0 0}
    .body{flex:1 1 auto;min-height:0;justify-content:flex-start;gap:28px;padding:0 24px max(32px,env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain}
    .headshot{flex:none;min-height:0}
    .experience li{grid-template-columns:84px 1fr auto;gap:12px;font-size:14px}
  }
  @media(prefers-reduced-motion:reduce){
    dialog,.panel{transition:none}
  }
  /* Reduced motion on phones: no travel; the sheet fades in place. */
  @media(max-width:700px) and (prefers-reduced-motion:reduce){
    .panel,.shown .panel{transform:none}
    .panel{opacity:0;transition:opacity 200ms ease}
    .shown .panel{opacity:1}
    dialog{transition:background-color 200ms ease}
  }
</style>
