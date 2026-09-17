<script>
  import { onMount } from 'svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { data } = $props();
  const project = $derived(data.project);
  const study = $derived(project.caseStudy);
  let navOffscreen = $state(false);
  let navContainer;
  let navigation;
  let leftImage;
  let rightImage;

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const navExitDistance = navigation.offsetHeight + 22;
    const update = () => {
      frame = undefined;
      const scroll = Math.max(0, window.scrollY);
      // Follow scroll directly, with no timed transition or collapse.
      const navOffset = navigation.contains(document.activeElement)
        ? 0
        : Math.min(scroll * (reducedMotion.matches ? 1 : 0.65), navExitDistance + 8);
      navContainer.style.transform = `translate3d(-50%, ${-navOffset}px, 0)`;
      navOffscreen = navOffset >= navExitDistance;
      const offset = reducedMotion.matches ? 0 : Math.min(scroll, 600);
      leftImage.style.transform = `translate3d(0, ${offset * 0.18}px, 0)`;
      rightImage.style.transform = `translate3d(0, ${offset * 0.26}px, 0)`;
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    reducedMotion.addEventListener('change', schedule);
    navigation.addEventListener('focusout', schedule);
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      reducedMotion.removeEventListener('change', schedule);
      navigation.removeEventListener('focusout', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });
</script>

<Metatags title="{project.name} — Sam Cheng" description={project.description} />

<main style:--project-color={study.color}>
  <div class="nav-island" bind:this={navContainer}>
  <nav bind:this={navigation} inert={navOffscreen} aria-label="Case study navigation">
      <a class="back" href="/#work">← Back</a>
      <div class="socials">
        <a href="https://linkedin.com/in/samfcheng" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://x.com/samfcheng" target="_blank" rel="noopener noreferrer">X</a>
        <a href="https://instagram.com/samssamples" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="mailto:sam@samfcheng.com">Email</a>
      </div>
    </nav>
  </div>
  <header class="hero" class:laptop={project.slug === 'classmate'}>
    <div class="hero-art" aria-hidden="true">
      <img bind:this={leftImage} class="left" src={study.heroImages[0]} alt="" />
      <img bind:this={rightImage} class="right" src={study.heroImages[1]} alt="" />
    </div>
    <div class="hero-title">
      <h1>{project.name}</h1>
      <p class="date">{project.date}</p>
    </div>
  </header>

  <section class="context reading-column" aria-labelledby="context-title">
    <h2 id="context-title"><span class="section-number" aria-hidden="true">00<span class="rule"></span></span>Context</h2>
    <dl class="metadata">
      <div><dt>Role</dt><dd>{study.role}</dd></div>
      <div><dt>Team</dt><dd>{study.team}</dd></div>
      <div><dt>Skills</dt><dd>{study.skills}</dd></div>
    </dl>
    <div class="copy">
      <h3>What is {project.name}?</h3>
      <p>{study.context}</p>
      <h3>Goal</h3>
      <p>{study.goal}</p>
    </div>
    <figure>
      <img src={project.images[0]} alt={study.alt} />
    </figure>
  </section>

  <section class="upcoming" aria-label="Full case study coming soon">
    <div class="reading-column blurred-preview" aria-hidden="true" inert>
      <h2><span class="section-number">01<span class="rule"></span></span>The problem</h2>
      <p>{study.goal}</p>
      <p>{study.context}</p>
      <!-- Decorative continuation only; the full case study is still in progress. -->
      <p>{project.description}</p>
      <p>{study.context}</p>
      <p>{study.goal}</p>
    </div>
    <div class="progressive-blur" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="coming-soon">
      <div class="pill-track" aria-hidden="true">
        {#each Array(2) as _}
          <div class="pill-group">
            {#each Array(16) as _, i}
              <span class:dark={i % 2 === 1}>Coming Soon</span>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </section>
</main>

<Footer />

<style>
  main{background:#fafafa;font-weight:400}
  .hero{height:520px;background:var(--project-color);position:relative;overflow:hidden;isolation:isolate}
  .nav-island{position:fixed;z-index:20;top:22px;left:50%;transform:translateX(-50%);width:550px;max-width:calc(100% - 40px)}
  nav{position:relative;width:100%;min-height:40px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;border-radius:999px;background:#000;color:#fff;font-size:16px}
  nav a{display:inline-block;padding:10px 5px;line-height:1.2}
  nav a:hover{opacity:.7}
  nav a:focus-visible{outline-color:white;outline-offset:0;border-radius:4px}
  .socials{display:flex;gap:6px;font-style:italic}
  .hero-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;pointer-events:none}
  h1{font-size:72px;line-height:1.05;letter-spacing:-.035em;font-weight:400}
  .date{font-size:16px;font-weight:400;font-style:italic;background:#fff;border-radius:999px;padding:10px 18px;line-height:1.2}
  .hero-art img{position:absolute;top:112px;width:650px;max-width:none;border-radius:12px;box-shadow:0 10px 40px #00000012}
  .left{right:calc(50% + 310px)}
  .right{left:calc(50% + 310px)}
  .laptop .hero-art img{width:950px;top:36px;box-shadow:none;border-radius:0}
  .laptop .left{right:calc(50% + 210px)}
  .laptop .right{left:calc(50% + 210px)}
  .reading-column{width:560px;max-width:calc(100% - 64px);margin-inline:auto}
  .context{padding-top:100px}
  h2{position:relative;font-weight:400;font-size:48px;line-height:1.2;letter-spacing:-.025em}
  .section-number{position:absolute;right:calc(100% + 16px);display:flex;align-items:center;gap:16px;white-space:nowrap}
  .rule{width:64px;height:1px;background:currentColor}
  .metadata{display:grid;grid-template-columns:1fr 1.5fr 1.4fr;gap:28px;margin:48px 0 28px;font-size:16px;line-height:1.45}
  dt,h3{font-size:16px;font-style:italic;font-weight:500;margin:0 0 8px}
  dd{margin:0}
  .copy p,.blurred-preview p{font-size:16px;font-weight:400;line-height:1.45}
  .copy h3:not(:first-child){margin-top:24px}
  figure{margin:54px 0 0;background:var(--project-color)}
  figure img{display:block;width:100%;height:auto}
  .upcoming{position:relative;isolation:isolate;overflow:hidden;margin-top:56px;height:310px}
  .blurred-preview{position:relative;user-select:none;pointer-events:none}
  .blurred-preview p{margin-top:24px}
  /* Fixed to the cropped section so the gradient is consistent across projects. */
  .progressive-blur{position:absolute;inset:-12px 0 0;pointer-events:none}
  .progressive-blur span{position:absolute;inset:0}
  .progressive-blur span:nth-child(1){backdrop-filter:blur(1px);mask-image:linear-gradient(transparent,#000 18%)}
  .progressive-blur span:nth-child(2){backdrop-filter:blur(2px);mask-image:linear-gradient(transparent 8%,#000 42%)}
  .progressive-blur span:nth-child(3){backdrop-filter:blur(4px);mask-image:linear-gradient(transparent 24%,#000 68%)}
  .progressive-blur span:nth-child(4){backdrop-filter:blur(8px);mask-image:linear-gradient(transparent 42%,#000 94%)}
  .progressive-blur::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 35%,rgb(250 250 250 / .25) 70%,rgb(250 250 250 / .85) 100%)}
  .coming-soon{position:absolute;top:124px;left:0;width:100%;overflow:hidden}
  .pill-track{display:flex;width:max-content;animation:marquee 70s linear infinite}
  .pill-group{display:flex;gap:20px;padding-right:20px;flex:none}
  @keyframes marquee{to{transform:translateX(-50%)}}
  .pill-track span{flex:none;min-width:148px;padding:14px 24px;background:#fff;border-radius:999px;text-align:center;font-size:1rem;line-height:1.1;letter-spacing:-.025em}
  .pill-track .dark{background:#000;color:#fff}
  @media(prefers-reduced-motion:reduce){
    .pill-track{animation:none}
  }
  @media(max-width:900px){
    .section-number{position:static;margin-right:16px;font-size:inherit}
    h2{display:flex;align-items:center}
    .hero-art{opacity:.65}
    .hero-title{z-index:1}
    .metadata{gap:16px}
  }
  @media(max-width:600px){
    nav{font-size:14px;padding-inline:8px}.socials{gap:0}
    .hero-art img{top:220px}.laptop .hero-art img{top:180px}
    .left,.laptop .left{right:calc(50% + 120px)}.right,.laptop .right{left:calc(50% + 120px)}
    .metadata{grid-template-columns:1fr;gap:20px}.context{padding-top:64px}
    .rule{width:32px}
  }
</style>
