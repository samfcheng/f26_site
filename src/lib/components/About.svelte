<script>
  let { open = $bindable(false) } = $props();

  const experience = [
    { years: '2026 – Now', company: 'Kleiner Perkins', role: 'Design Fellow' },
    { years: '2026', company: 'Multiply', role: 'Product Design' },
    { years: '2023 – 2025', company: 'Independent', role: 'Freelance Designer' },
    { years: '2023 – 2024', company: 'Oracle Education Foundation', role: 'Intern' }
  ];

  let dialog;
  let shown = $state(false);

  // Open: show the dialog, then add `shown` on the next frame so the panel
  // slides in. Close: remove `shown`, and close the dialog once it's out.
  $effect(() => {
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => shown = true);
    } else if (!open && dialog.open) {
      shown = false;
      let done = false;
      const finish = () => {
        if (done || open) return;
        done = true;
        dialog.close();
        document.documentElement.style.overflow = '';
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
      dialog.querySelector('.panel').addEventListener('transitionend', finish, { once: true });
      // In case the transition never runs (e.g. a background tab).
      setTimeout(finish, 600);
    }
  });

  function cancel(event) {
    event.preventDefault();
    open = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class:shown aria-labelledby="about-title" oncancel={cancel} onclick={event => { if (event.target === dialog) open = false; }}>
  <div class="panel">
    <div class="intro">
    <header>
      <h2 id="about-title">About</h2>
      <button type="button" class="close" aria-label="Close" onclick={() => open = false}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </header>
    <div class="bio">
      <p>I’m a designer studying Arts, Technology, &amp; Business at USC. I like working on a product end to end: talking with the people who use it, sweating the details, and building products people care about.</p>
      <p>This past summer, I was the youngest Kleiner Perkins fellow and Multiply’s first design intern, redesigning the tools their loan officers use every day.</p>
    </div>
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
</dialog>

<style>
  dialog{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:rgb(0 0 0 / 0);transition:background .4s ease}
  dialog.shown{background:rgb(0 0 0 / .12)}
  dialog::backdrop{background:none}
  /* Intro, photo, and experience are spread down the full height, so the
     experience list sits at the bottom; on short screens they stack and scroll. */
  .panel{position:absolute;top:0;left:0;bottom:0;display:flex;flex-direction:column;justify-content:space-between;gap:clamp(24px,4vh,40px);width:min(520px,100vw);padding:clamp(32px,5vh,56px) 56px;overflow-y:auto;overscroll-behavior:contain;background:#fff;font-weight:400;transform:translateX(-100%);transition:transform .45s var(--ease-out)}
  .shown .panel{transform:none}
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
  @media(max-width:600px){
    .panel{padding:28px 24px 40px;gap:32px}
    h2{font-size:38px}
    .experience li{grid-template-columns:84px 1fr auto;gap:12px;font-size:14px}
  }
  @media(prefers-reduced-motion:reduce){dialog,.panel{transition:none}}
</style>
