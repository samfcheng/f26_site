<script>
  let { src, alt, caption, label, width, height, placeholder } = $props();
</script>

<figure>
  {#if label}<p class="label">{label}</p>{/if}
  {#if placeholder}
    <div class="placeholder">
      <span class="placeholder-tag">Visual to add</span>
      <p>{placeholder}</p>
    </div>
  {:else}
    <a href={src} target="_blank" rel="noopener noreferrer" aria-label="View full-size image: {alt} (opens in a new tab)">
      <img {src} {alt} {width} {height} loading="lazy" decoding="async" />
    </a>
  {/if}
  {#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
  figure{margin:0;min-width:0}
  .label{font-size:13px;font-weight:500;margin-bottom:12px}
  a{display:block;border-radius:8px;overflow:hidden;background:#eeeaf7;outline-offset:5px}
  img{display:block;width:100%;height:auto}
  figcaption{font-size:14px;line-height:1.5;color:#62606a;margin-top:14px;font-weight:400;text-wrap:pretty}
  .placeholder{min-height:240px;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;background:#f1eff6;border:1px dashed #b5adc8;border-radius:8px}
  .placeholder-tag{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#625573}
  .placeholder p{font-size:17px;line-height:1.5;font-weight:400;max-width:440px}
  @media(max-width:600px){.placeholder{padding:28px;min-height:200px}}
</style>
