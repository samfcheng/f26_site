<script>
  import { onMount } from 'svelte';
  import { projects } from '$lib/projects.js';

  import { tiles } from './layout.js';
  let canvas;
  let screenTransform = $state('none');
  let status = $state('loading');
  onMount(() => {
    let cancelled = false, scene;
    import('./desk-scene.js')
      .then(({ createDeskScene }) => cancelled ? null : createDeskScene(canvas, projects, transform => { if (!cancelled) screenTransform = transform; }))
      .then(instance => { if (cancelled) instance?.dispose();else { scene = instance;status = 'ready'; } })
      .catch(error => { if (!cancelled) { status = 'error';console.error('Desk scene could not start:', error); } });
    return () => { cancelled = true;scene?.dispose(); };
  });
</script>

<svelte:head>
  <title>At my desk — Sam Cheng</title>
  <meta name="description" content="A few things I've been working on. Explore Multiply, Classmate, and Olos." />
  <meta name="robots" content="noindex" />
</svelte:head>

<main>
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      {#each [0, 1] as copy}
        <div class="marquee-group">{#each [0, 1, 2, 3] as word}<span>Work</span>{/each}</div>
      {/each}
    </div>
  </div>
  <section class="desk-stage" aria-label="Selected work on my desk" data-state={status}>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
    <div class="screen" class:ready={status !== 'loading'} class:fallback={status === 'error'}
      style:transform={status === 'error' ? undefined : screenTransform}>
      {#each projects as project, index}
        <a class="project" href="/work/{project.slug}"
          aria-label="{project.name} — {project.date}. View case study."
          style:left="{tiles[index].x * 100}%" style:top="{tiles[index].y * 100}%"
          style:width="{tiles[index].w * 100}%" style:height="{tiles[index].h * 100}%">
          {#if status === 'error'}<img src={project.images[0]} alt="" />{/if}
          <div class="project-caption"><span>{project.name}</span><span class="arrow" aria-hidden="true">↗</span></div>
          <span class="project-date">{project.date}</span>
        </a>
      {/each}
    </div>
  </section>
</main>

<style>
  main{position:relative;height:100vh;min-height:680px;overflow:hidden;background:#fafafa;isolation:isolate}
  .marquee{position:absolute;top:21%;left:0;width:100%;z-index:-1;overflow:hidden;pointer-events:none}
  .marquee-track{display:flex;width:max-content;animation:marquee 48s linear infinite;will-change:transform}
  .marquee-group{display:flex;flex-shrink:0;gap:72px;padding-right:72px}
  .marquee span{font-size:260px;line-height:1.05;letter-spacing:-.06em;color:#bcc5d2}
  main:focus-within .marquee-track{animation-play-state:paused}
  @keyframes marquee{to{transform:translateX(-50%)}}
  .desk-stage{position:absolute;inset:0}
  canvas{display:block;width:100%;height:100%;pointer-events:none}
  .screen{position:absolute;left:0;top:0;width:1000px;height:562.35px;transform-origin:0 0;opacity:0;pointer-events:none;will-change:transform}.screen.ready{opacity:1}
  .project{position:absolute;border-radius:8px;pointer-events:auto;color:white;display:flex;flex-direction:column;justify-content:flex-end;padding:14px 16px;isolation:isolate}
  .project::after{content:'';position:absolute;inset:45% 0 0;border-radius:0 0 8px 8px;background:linear-gradient(transparent,rgba(0,0,0,.5));z-index:-1;pointer-events:none}
  .project::before{position:absolute;inset:0;content:'';border:2px solid rgba(255,255,255,.85);border-radius:inherit;opacity:0;transition:opacity 180ms ease;pointer-events:none}
  .project-caption{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:24px;line-height:1.15;text-shadow:0 1px 8px #0005}
  .project-date{font-size:12px;line-height:1.3;opacity:.85;margin-top:4px;text-shadow:0 1px 6px #0008}
  .arrow{display:inline-block;transition:transform 180ms var(--ease-out)}
  .project:focus-visible{outline:3px solid #bca9ff;outline-offset:3px}.project:focus-visible::before{opacity:1}
  @media(hover:hover) and (pointer:fine){.project:hover::before{opacity:1}.project:hover .arrow{transform:translate(2px,-2px)}}
  .fallback{left:20%;top:16%;width:60%;height:60%;background:#e8edf4;border:14px solid #171717;border-radius:12px;box-shadow:0 24px 45px #0002}.fallback img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;border-radius:inherit;filter:brightness(.65)}
  @media(prefers-reduced-motion:reduce){.marquee-track{animation:none;will-change:auto}.arrow{transition:none}.project:hover .arrow{transform:none}}
</style>
