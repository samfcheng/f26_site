<script>
  import { tick } from 'svelte';
  let { src, alt, caption, label, width, height, placeholder, background, eager = false } = $props();

  // Ease in and out: the image travels between two points on screen.
  const EASE = 'cubic-bezier(.4, 0, .2, 1)';
  let link, dialog, scrim, closeButton, zoomedImage;
  let open = $state(false);
  let closing = false;
  let frame = $state({ left: 0, top: 0, width: 0, height: 0 });
  let imageAnimation, fadeAnimations = [];

  // Fit the image to the viewport, centred, with a gutter.
  function fit() {
    const gutter = innerWidth < 600 ? 16 : 48;
    // Without explicit dimensions, fall back to the loaded thumbnail's.
    const image = link.querySelector('img');
    const naturalWidth = width ?? image.naturalWidth, naturalHeight = height ?? image.naturalHeight;
    const scale = Math.min((innerWidth - gutter * 2) / naturalWidth, (innerHeight - gutter * 2) / naturalHeight);
    const w = naturalWidth * scale, h = naturalHeight * scale;
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  }
  // The zoomed image's resting look, and the one that puts it back over the
  // thumbnail. Shadow and radius are divided by the scale so, once scaled
  // down, they match the thumbnail's own and the hand-off is seamless.
  const zoomedStyle = { transform: 'none', borderRadius: '4px', boxShadow: '0 2px 6px #0000001a, 0 16px 48px #00000033' };
  function thumbnailStyle() {
    const rect = link.getBoundingClientRect(), scale = rect.width / frame.width, px = value => `${value / scale}px`;
    return {
      transform: `translate(${rect.left - frame.left}px, ${rect.top - frame.top}px) scale(${scale})`,
      borderRadius: px(4),
      boxShadow: `0 ${px(1)} ${px(2)} #0000000a, 0 ${px(2)} ${px(8)} #00000008`
    };
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function zoomIn(event) {
    // Leave modified clicks alone so the image can still open in a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || open) return;
    event.preventDefault();
    frame = fit();
    open = true;
    await tick();
    dialog.showModal();
    link.classList.add('zoomed');
    const options = { duration: reduced() ? 150 : 450, easing: EASE };
    fadeAnimations = [scrim, closeButton].map(element => element.animate([{ opacity: 0 }, { opacity: 1 }], options));
    imageAnimation = zoomedImage.animate(reduced()
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [thumbnailStyle(), zoomedStyle], options);
  }

  async function zoomOut() {
    if (!open || closing) return;
    closing = true;
    if (imageAnimation?.playState === 'running') {
      // Mid-open: run the same animation backwards from wherever it is.
      imageAnimation.reverse();
      fadeAnimations.forEach(animation => animation.reverse());
    } else {
      const options = { duration: reduced() ? 120 : 400, easing: EASE, fill: 'forwards' };
      fadeAnimations = [scrim, closeButton].map(element => element.animate([{ opacity: 1 }, { opacity: 0 }], options));
      imageAnimation = zoomedImage.animate(reduced()
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [zoomedStyle, thumbnailStyle()], options);
    }
    await imageAnimation.finished.catch(() => {});
    link.classList.remove('zoomed');
    dialog.close();
    open = false;
    closing = false;
  }

  // One-finger swipes dismiss; leave pinches to the browser.
  function touchmove(event) {
    if (event.touches.length === 1) zoomOut();
  }

  function cancel(event) {
    event.preventDefault();
    zoomOut();
  }
</script>

<svelte:window onresize={zoomOut} />

<figure style:flex={width && height ? `${width / height} 1 0` : undefined}>
  {#if label}<p class="label">{label}</p>{/if}
  {#if placeholder}
    <div class="placeholder">
      <span class="placeholder-tag">Visual to add</span>
      <p>{placeholder}</p>
    </div>
  {:else}
    <a bind:this={link} href={src} style:background onclick={zoomIn} aria-haspopup="dialog" aria-label="View larger: {alt}">
      <img {src} {alt} {width} {height} loading={eager ? undefined : 'lazy'} decoding="async" />
    </a>
  {/if}
  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

{#if open}
  <!-- Any click, scroll, or Escape closes it; the button covers keyboard and screen readers. -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <dialog bind:this={dialog} class="lightbox" aria-label={alt} oncancel={cancel} onclick={zoomOut} onwheel={zoomOut} ontouchmove={touchmove}>
    <div class="scrim" bind:this={scrim}></div>
    <img bind:this={zoomedImage} {src} {alt} style:background style:left="{frame.left}px" style:top="{frame.top}px" style:width="{frame.width}px" style:height="{frame.height}px" />
    <button bind:this={closeButton} class="close" type="button" aria-label="Close image">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
  </dialog>
{/if}

<style>
  figure{margin:0;min-width:0}
  .label{font-size:13px;font-weight:500;margin-bottom:12px}
  a{display:block;border-radius:4px;overflow:hidden;background:#eeeaf7;outline-offset:5px;box-shadow:0 1px 2px #0000000a,0 2px 8px #00000008;cursor:zoom-in}
  a:global(.zoomed){visibility:hidden}
  img{display:block;width:100%;height:auto}
  figcaption{font-size:14px;line-height:1.5;color:#77747f;margin-top:14px;font-weight:400;text-wrap:pretty}
  .placeholder{min-height:240px;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;background:#f1eff6;border:1px dashed #b5adc8;border-radius:8px}
  .placeholder-tag{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#625573}
  .placeholder p{font-size:17px;line-height:1.5;font-weight:400;max-width:440px}

  .lightbox{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:none;overflow:hidden;cursor:zoom-out}
  .lightbox::backdrop{background:none}
  .scrim{position:absolute;inset:0;background:rgb(0 0 0 / .45);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
  .lightbox img{position:absolute;width:auto;max-width:none;border-radius:4px;box-shadow:0 2px 6px #0000001a,0 16px 48px #00000033;transform-origin:0 0;will-change:transform}
  .close{position:absolute;top:16px;right:16px;display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:999px;background:#fff;color:#000;cursor:pointer;outline-offset:3px}
  @media(max-width:600px){.placeholder{padding:28px;min-height:200px}.close{top:12px;right:12px}}
</style>
