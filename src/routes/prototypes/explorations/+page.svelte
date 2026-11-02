<script>
  import Work from '$lib/components/Work.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Pinboard from './Pinboard.svelte';
</script>

<svelte:head>
  <title>Explorations prototype — Sam Cheng</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- The hero is left out so the work rows and the new section sit together
     on first load. Sections alternate: work on the page grey, the board on
     white, the footer back on grey. -->
<main>
  <Work />
  <Pinboard />
</main>
<div class="footer"><Footer /></div>

<style>
  .footer :global(footer){background:#fafafa}
</style>
