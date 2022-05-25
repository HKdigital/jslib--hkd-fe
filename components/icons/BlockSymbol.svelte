<script>

/* -------------------------------------------------------------------- About */

  //
  // Example usage:
  //
  // import { menu, close }
  //   from "@hkd-fe/components/icons/paths/material-symbols-f0w100g200os48.js";
  //
  // import BlockSymbol from "@hkd-fe/components/icons/BlockSymbol.svelte";
  //
  // <Symbol path={menu} on:click={...} />
  // <Symbol path={close} on:click={...} />
  //

  //
  // Idea borrowed from:
  // @see https://svelte.recipes/components/icon/
  //

/* ---------------------------------------------------------------- Internals */

  let currentSize;
  let currentRotation;

  let style = "";

/* ------------------------------------------------------------------ Exports */

  // Path of the Material Symbols icon
  export let path;

  export let size = 0;
  export let rotate = 0;
  export let spin = false;

  export let cssClassNames = "";
  export { cssClassNames as class };


/* -------------------------------------------------------------------- Logic */

  $: {
    if( size !== currentSize || rotate !== currentRotation )
    {
      style = "";

      if( rotate )
      {
        style += `transform: rotate(${rotate}deg);`;

        currentRotation = rotate;
      }

      if( size )
      {
        style += `width: ${size}em;height: ${size}em;`;

        currentSize = size;
      }
    }
  }

</script>

<div class="c-symbol {cssClassNames}"
     class:x-spin={spin}>
  <svg
    viewBox="0 0 48 48"
    fill-rule="evenodd"
    clip-rule="evenodd"
    {style}
    on:click>
    <path d="{path}"></path>
  </svg>
</div>

<style>
  :global(.c-symbol)
  {
    display: block;
    cursor: pointer !important; /* FIXME: why important? */
    overflow: visible;
    /*background-color: blue;*/
  }

  :global(.c-symbol) > svg
  {
    /* https://stackoverflow.com/questions/
       24626908/how-to-get-rid-of-extra-space-below-svg-in-div-element  */
    display: block;
    fill: currentColor;
    /*background-color: red;*/
  }

  :global(.c-symbol).x-spin
  {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }

</style>