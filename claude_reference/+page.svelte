<script>
  import '$lib/globals.scss';
  import '$lib/landing.scss';

  import Metatags from '$lib/Metatags.svelte';

  import { onMount, onDestroy } from 'svelte';
  import dayjs from 'dayjs';

  let time = $state(dayjs().format('h:mm A'));
  let interval;
  let width = $state(1000);
  let menu_open = $state(false);

  onMount(() => {
    width = window.innerWidth;

    interval = setInterval(() => {
      time = dayjs().format('h:mm A');
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));

  let title_menu = $state(false);

  let waving = $state(false);
  function triggerWave() {
    if (!waving) {
      waving = true;

      setTimeout(() => {
        waving = false
      }, 1000)
    }
  }

  function recalculateWidth() {
    width = window.innerWidth
  }
</script>

<svelte:window onresize={recalculateWidth}/>

<Metatags/>

<main class="landing">
  <header class="landing-header">
    <nav class="landing-nav">
      <span class="name">
        <img src="/images/name.svg" alt="Sam Cheng"/>
      </span>
      {#if width > 600}
        <div class="links">
          <span class="time">
            {time} Los Angeles
          </span>
          <a href="https://linkedin.com/in/samfcheng" target="_blank">
            LinkedIn
          </a>
          <a href="https://x.com/samfcheng" target="_blank">
            X (Twitter)
          </a>
          <a href="https://instagram.com/samssamples" target="_blank">
            Instagram
          </a>
          <a href="mailto:sam@samcheng.co">
            Contact
          </a>
        </div>
      {:else}
        <button class={menu_open ? "menu-open-close open" : "menu-open-close closed"} aria-label="open/close menu" onclick={() => {menu_open = !menu_open}}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      {/if}
    </nav>
    {#if width > 900}
      <h1 class="header-title">
        <div class="title-top">
          <span>I'm</span>
          <div class="rich image headshot"></div>
          <span><span class="name">Sam Cheng</span>,</span> <span>a</span>
          <div class="design-button-wrapper">
            <button class="rich design-button" class:active={title_menu} onclick={() => {title_menu = !title_menu}} aria-label="Learn More">
              <span class="x-icon"></span>
              <span class="left-corners"></span>
              <span class="right-corners"></span>
            </button>
            <div class="design-popup" class:open={title_menu}>
              <p>
                I love designing valuable products and telling meaningful stories
              </p>
            </div>
          </div>
          <span>designer &</span>
        </div>
        <div class="title-bottom">
          <span>storyteller</span>
          <div class="rich wave" class:waving={waving} onmouseenter={triggerWave} aria-hidden="true">
            <img src="/images/icon-wave.svg" alt="Waving Hand Icon">
          </div>
          <span>based in</span>
          <div class="rich image california"></div>
          <div class="california-text-wrapper">
            <span class="california-text">California</span>
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
            <img src="/images/flower.svg" alt="decorative flower" aria-hidden="true" class="flower">
          </div>
        </div>
      </h1>
    {:else}
      <h1 class="small-title">
        I'm <span class="image headshot"></span> Sam Cheng, a designer and storyteller based in <span class="image california"></span> California
      </h1>
    {/if}
    <span class="spacer"></span>
  </header>
  <div class="work">
    <section>
      <div class="work-top">
        <span class="work-info">
          <a href="/projects/classmate" class="work-title">Classmate</a>
          <span class="work-role">Founder</span>
        </span>
        <span class="date">Aug 2024 - Present</span>
      </div>
      <div class="work-photos">
        <div class="image">
          <img src="/images/work/classmate01.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/classmate02.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/classmate03.webp" alt="Work  Screenshot">
        </div>
        <div class="hover-targets">
          <div class="hover-target"></div>
          <div class="hover-target"></div>
          <div class="hover-target"></div>
        </div>
      </div>
      <div class="work-bottom">
        <span class="work-skills">Brand, Design, Development</span>
        <a href="//www.classmate.app" target="_blank">
          <span class="text">
            <span>View</span>
            <span>View</span>
          </span>
          <span class="arrow">→</span>
        </a>
      </div>
    </section>
    <section>
      <div class="work-top">
        <span class="work-info">
          <a href="/projects/olos" class="work-title">Olos</a>
          <span class="work-role">Founding Designer</span>
        </span>
        <span class="date">Sep 2025 - Dec 2026</span>
      </div>
      <div class="work-photos">
        <div class="image">
          <img src="/images/work/olos01.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/olos02.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/olos03.webp" alt="Work  Screenshot">
        </div>
        <div class="hover-targets">
          <div class="hover-target"></div>
          <div class="hover-target"></div>
          <div class="hover-target"></div>
        </div>
      </div>
      <div class="work-bottom">
        <span class="work-skills">Brand, Design</span>
        <a href="mailto:sam@samcheng.co">
          <span class="text">
            <span>Inquire</span>
            <span>Inquire</span>
          </span>
          <span class="arrow">→</span>
        </a>
      </div>
    </section>
    <section>
      <div class="work-top">
        <span class="work-info">
          <a href="/projects/openform" class="work-title">OpenForm</a>
          <span class="work-role">Project</span>
        </span>
        <span class="date">Aug 2023 - May 2024</span>
      </div>
      <div class="work-photos">
        <div class="image">
          <img src="/images/work/openform01.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/openform02.webp" alt="Work Screenshot">
        </div>
        <div class="image">
          <img src="/images/work/openform03.webp" alt="Work  Screenshot">
        </div>
        <div class="hover-targets">
          <div class="hover-target"></div>
          <div class="hover-target"></div>
          <div class="hover-target"></div>
        </div>
      </div>
      <div class="work-bottom">
        <span class="work-skills">Brand, Design, Development</span>
        <a href="mailto:sam@samcheng.co">
          <span class="text">
            <span>Inquire</span>
            <span>Inquire</span>
          </span>
          <span class="arrow">→</span>
        </a>
      </div>
    </section>
  </div>
</main>

<nav class={menu_open ? "navbar-menu" : "navbar-menu closed"}>
  <div class="menu-top-spacer"></div>
  <div class="menu-links">
    <a href="https://linkedin.com/in/samfcheng" target="_blank">
      LinkedIn
    </a>
    <a href="https://x.com/samfcheng" target="_blank">
      X (Twitter)
    </a>
    <a href="https://instagram.com/samssamples" target="_blank">
      Instagram
    </a>
    <a href="mailto:sam@samcheng.co">
      Contact
    </a>
  </div>
  <div class="menu-bottom-links">
    <span>© Sam Cheng</span>
    <span>2026</span>
  </div>
</nav>

<button class={menu_open ? "menu-background" : "menu-background closed"} aria-label="close menu" onclick={() => {menu_open = false}}></button>
