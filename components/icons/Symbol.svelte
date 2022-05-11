<script>

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

  let currentSize;
  let currentRotation;

  // Path of the Material Symbols icon
  export let path;

  export let size = 0;
  export let rotate = 0;

  export let cssClasses = "";

  let style = "";

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

<svg
  class="c-symbol {cssClasses}"
  viewBox="0 0 48 48"
  fill-rule="evenodd"
  clip-rule="evenodd"
  style={style}
  on:click>
  <path d="{path}"></path>
</svg>

<style>
  :global(.c-symbol)
  {
    cursor: pointer !important;
    fill: currentColor;
    overflow: visible;
    /*background-color: green;*/
    /*border: solid 1px green;*/
  }
</style>