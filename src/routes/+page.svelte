<script>
  import { onMount } from 'svelte';
  import { sway } from '$lib/sway.js';
  let mobile = $state(true);
  onMount(() => {
    const breakpoint = matchMedia('(max-width: 700px)');
    const resize = () => { mobile = breakpoint.matches; };
    resize();
    breakpoint.addEventListener('change', resize);
    return () => breakpoint.removeEventListener('change', resize);
  });
  import Footer from '$lib/components/Footer.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Work from '$lib/components/Work.svelte';
  import Explorations from '$lib/explorations/Explorations.svelte';
  import Metatags from '$lib/components/Metatags.svelte';
  import About from '$lib/components/About.svelte';
  let aboutOpen = $state(false);
</script>

<Metatags description="I design products and the stories behind them. Currently studying Arts, Technology, & Business at USC." video="https://www.samfcheng.com/og.mp4" />
<a class="skip" href="#work">Skip to work</a>
<main>
  <section class="hero" aria-label="Introduction">
    <p class="intro">I design products and the<br />stories behind them. <button type="button" class="more" aria-haspopup="dialog" onclick={() => aboutOpen = true}>[more]</button></p>
    <p class="education">Currently studying Arts,<br />Technology, &amp; Business @ USC</p>
    <h1><span>Sam</span> <span>Cheng</span></h1>
    {#if mobile}
      <!-- On phones the badge hangs from the top edge on its strap, as if worn.
           It carries the name, so the copy below it stays quiet. -->
      <div class="lanyard">
        <img use:sway={{ stiffness: 30, scroll: .12, tap: 14 }} src="/assets/badge-lanyard.webp" alt="Sam Cheng’s badge on a lanyard" width="900" height="1997" fetchpriority="high" />
      </div>
      <div class="lanyard-copy">
        <p class="lead">I design products and the stories behind them.</p>
        <p class="meta">Currently studying Arts, Technology, &amp; Business @ USC. <button type="button" class="more" aria-haspopup="dialog" onclick={() => aboutOpen = true}>[more]</button></p>
      </div>
    {:else}
      <Badge />
    {/if}
  </section>
  <Work />
  <Explorations />
</main>
<div class="footer"><Footer /></div>
<About bind:open={aboutOpen} />

<style>
  .footer :global(footer){background:#fafafa}
  .skip{position:fixed;top:16px;left:16px;z-index:10;padding:12px;background:white;transform:translateY(-200%)}.skip:focus{transform:none}
  .hero{position:relative;width:100%;height:100vh;background:#fff;overflow:hidden}
  .intro,.education{position:absolute;top:100px;font-size:1rem;line-height:1.25;letter-spacing:-.02em;z-index:3;pointer-events:none}
  .intro{left:var(--page-gutter)}
  .more{pointer-events:auto;padding:0;border:0;background:none;color:#8a8792;font:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;cursor:pointer;transition:color .15s ease}
  .more:hover{color:#080808}
  .more:focus-visible{outline:2px solid #7950ef;outline-offset:3px;border-radius:2px}.education{right:var(--page-gutter);text-align:right}
  h1{position:absolute;left:-2.3vw;bottom:3vw;font-size:19.9vw;line-height:1;letter-spacing:-.02em;white-space:nowrap}
  .lanyard,.lanyard-copy{display:none}
  @media(max-width:700px){
    /* The badge shows the name, so the heading and the desktop copy step
       aside; the heading stays for screen readers. */
    /* svh: sized to the screen with the browser's toolbars showing, so the
       copy is never under them on first load. */
    .hero{display:flex;flex-direction:column;height:100svh;min-height:520px;padding:0 24px max(36px,env(safe-area-inset-bottom))}
    .intro,.education{display:none}
    h1{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    /* The copy takes its height; the badge gets whatever is left above it,
       scaled to fit that height or the width cap, whichever is tighter. So a
       short screen gets a smaller badge rather than one hanging into the text. */
    .lanyard{display:block;flex:1 1 0;min-height:0;align-self:center;width:min(80vw,340px);margin-bottom:8px}
    /* Pinned to the top edge, where the strap leaves the screen, and swings
       from there. */
    .lanyard img{display:block;width:100%;height:100%;object-fit:contain;object-position:50% 0;transform-origin:50% 0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
    .lanyard-copy{display:block;position:relative;z-index:2}
    .lead{font-size:28px;line-height:1.12;letter-spacing:-.03em;text-wrap:balance;margin-bottom:12px}
    .meta{font-size:16px;line-height:1.3;letter-spacing:-.02em;color:#77747f}
  }
</style>
