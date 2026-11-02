<script>
  import { onMount } from 'svelte';
  import { renderPinSheets, POSE } from './pin-scene.js';
  let sheets = $state([]);
  let status = $state('rendering');
  onMount(() => {
    // ?pose={"rest":{"tilt":64,"lean":100},...} tries a pose without editing.
    const pose = new URLSearchParams(location.search).get('pose');
    renderPinSheets(pose ? { ...POSE, ...JSON.parse(pose) } : POSE)
      .then(result => { sheets = result; status = 'done'; })
      .catch(error => { status = 'error'; console.error(error); });
  });
</script>

<svelte:head>
  <title>Pin render</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- Offline tool: renders the push pin's lift sequence to spritesheets.
     Headless Chrome dumps the DOM and the data URLs are saved as files in
     static/explorations/pins/; the site itself never runs three.js for pins. -->
<main data-status={status}>
  {#each sheets as sheet}
    <figure>
      <img src={sheet.url} alt="{sheet.name} pin spritesheet" />
      <textarea readonly data-name={sheet.name}>{sheet.url}</textarea>
      <figcaption>{sheet.name}</figcaption>
    </figure>
  {/each}
</main>

<style>
  main{display:flex;flex-wrap:wrap;gap:24px;padding:24px;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px}
  img{display:block;width:480px;height:auto}
  textarea{display:none}
</style>
