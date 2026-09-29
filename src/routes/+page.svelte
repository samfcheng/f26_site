<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  let mobile = $state(true);
  let mobileBadge;
  // Renders of the 3D badge in its sleeve, without the strap and clip.
  const badgeImage = $derived(page.url.searchParams.has('filter') ? '/assets/badge-mobile-filter.webp' : '/assets/badge-mobile.webp');
  onMount(() => {
    const breakpoint = matchMedia('(max-width: 700px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const update = () => {
      frame = undefined;
      if (mobileBadge) {
        const progress = Math.min(Math.max(scrollY, 0) / innerHeight, 1);
        mobileBadge.style.transform = `rotate(${reduced.matches ? 7 : 7 - progress * 12}deg)`;
      }
    };
    const scroll = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    const resize = () => { mobile = breakpoint.matches; scroll(); };
    resize();
    breakpoint.addEventListener('change', resize);
    reduced.addEventListener('change', scroll);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      breakpoint.removeEventListener('change', resize);
      reduced.removeEventListener('change', scroll);
      window.removeEventListener('scroll', scroll);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  });
  import Footer from '$lib/components/Footer.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Work from '$lib/components/Work.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import About from '$lib/components/About.svelte';
  let aboutOpen = $state(false);
</script>

<Metatags description="I design products and the stories behind them. Currently studying Arts, Technology, & Business at USC." />
<a class="skip" href="#work">Skip to work</a>
<main>
  <section class="hero" aria-label="Introduction">
    <p class="intro">I design products and the<br />stories behind them. <button type="button" class="more" aria-haspopup="dialog" onclick={() => aboutOpen = true}>[more]</button></p>
    <p class="education">Currently studying Arts,<br />Technology, &amp; Business @ USC</p>
    <h1><span>Sam</span> <span>Cheng</span></h1>
    {#if mobile}
      <div class="mobile-badge">
        <img bind:this={mobileBadge} src={badgeImage} alt="Sam Cheng badge in a clear sleeve" width="995" height="1666" fetchpriority="high" />
      </div>
    {:else}
      <Badge />
    {/if}
  </section>
  <Work />
</main>
<Footer />
<About bind:open={aboutOpen} />

<style>
  .skip{position:fixed;top:16px;left:16px;z-index:10;padding:12px;background:white;transform:translateY(-200%)}.skip:focus{transform:none}
  .hero{position:relative;width:100%;height:100vh;background:#fff;overflow:hidden}
  .intro,.education{position:absolute;top:100px;font-size:1rem;line-height:1.25;letter-spacing:-.02em;z-index:3;pointer-events:none}
  .intro{left:var(--page-gutter)}
  .more{pointer-events:auto;padding:0;border:0;background:none;color:#8a8792;font:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;cursor:pointer;transition:color .15s ease}
  .more:hover{color:#080808}
  .more:focus-visible{outline:2px solid #7950ef;outline-offset:3px;border-radius:2px}.education{right:var(--page-gutter);text-align:right}
  h1{position:absolute;left:-2.3vw;bottom:3vw;font-size:19.9vw;line-height:1;letter-spacing:-.02em;white-space:nowrap}
  .mobile-badge{display:none}
  @media(max-width:700px){
    .hero{height:100svh;min-height:700px}
    .intro,.education{font-size:1rem;line-height:1.25}
    .intro{top:44px;left:32px}
    .education{top:108px;right:32px}
    h1{z-index:3;left:50%;right:auto;bottom:28px;width:max-content;transform:translateX(-50%);text-align:left;font-size:32vw;line-height:.88;letter-spacing:-.035em;white-space:normal;pointer-events:none}
    h1 span{display:block}
    .mobile-badge{display:flex;position:absolute;z-index:2;inset:174px 20px calc(56.32vw + 28px);align-items:center;justify-content:center;pointer-events:none}
    /* The render's shadow falls below the sleeve, so nudge it down to sit visually centred. */
    .mobile-badge img{display:block;width:84%;height:100%;object-fit:contain;transform:rotate(7deg);translate:0 5%}
  }
</style>
