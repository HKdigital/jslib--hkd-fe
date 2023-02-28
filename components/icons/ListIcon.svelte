<script>

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export let content;

export { cssClassNames as class };

export let onColor = null;

</script>

<div c-list-icon class="x-color-on-{onColor} {cssClassNames}">
  <svelte:component this={content} />
</div>

<style type="text/scss">
  [c-list-icon] {
    display: inline-flex;
    align-self: center;
  }

  :global( [c-list-icon] svg )
  {
    /*
      @see https://blog.prototypr.io
           /align-svg-icons-to-text-and-say-goodbye-to-font-icons-d44b3d7b26b4
    */
    position: relative;
  }

</style>