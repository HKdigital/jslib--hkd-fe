<script>

/* -------------------------------------------------------------------- About */

  //
  // Example usage:
  //
  // import { menu, close }
  //   from "@hkd-fe/components/icons/paths/material-symbols-f0w100g200os48.js";
  //
  // import Symbol from "@hkd-fe/components/icons/Symbol.svelte";
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

  export let cssClasses = "";

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

<div class="c-symbol {cssClasses}">
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
    display: inline-block;
    height: 1em;
    width: 1em;

    cursor: pointer !important;
    overflow: visible;
  }

  :global(.c-symbol) > svg
  {
    fill: currentColor;

    position: relative;
    top: 0.25em;
  }

</style>