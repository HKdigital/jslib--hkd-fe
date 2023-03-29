<script>

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export let content;

export { cssClassNames as class };

export let onColor = null;

</script>

<div c-inline-icon class="x-on-{onColor} {cssClassNames}">
<svelte:component this={content} />
</div>

<style lang="scss">
  [c-inline-icon] {
    display: inline-flex;
    align-self: center;
  }

  :global( [c-inline-icon] svg )
  {
    /*
      @see https://blog.prototypr.io
           /align-svg-icons-to-text-and-say-goodbye-to-font-icons-d44b3d7b26b4
    */
    position: relative;
    top: 0.125em;
    height:1em;
    width:1em;
  }

</style>