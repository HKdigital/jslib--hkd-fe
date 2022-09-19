<script>

/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber } from "@hkd-base/helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

// let boxWidth;
// let boxHeightStyle;

let style = "";

/* ------------------------------------------------------------------ Exports */

export let aspect = 16 / 9;

let cssClassNames = "";
export { cssClassNames as class };

/* --------------------------------------------------------------- Reactivity */

$: {
  expectPositiveNumber( aspect );

  style = `aspect-ratio: ${aspect};`;
}


// $: {
//   //
//   // - Set box height based on box width and aspect
//   //
//   if( boxWidth )
//   {
//     boxHeightStyle = `height: ${boxWidth / aspect}px`;
//   }
// }

</script>

<!-- <div class="c-aspect-box {cssClassNames}"
     bind:clientWidth={boxWidth} style={boxHeightStyle}>
  {#if boxHeightStyle}
    <slot></slot>
  {/if}
</div> -->

{#if style}
  <div class="c-aspect-box {cssClassNames}" {style}>
    <slot></slot>
  </div>
{/if}

<style>
  :global(.c-aspect-box) {}
</style>
